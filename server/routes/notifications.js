const express = require('express');
const router = express.Router();
const emailService = require('../services/email.service');
const whatsappService = require('../services/whatsapp.service');
const sheetsService = require('../services/sheets.service');

/**
 * POST /api/notifications/send
 * Envia notificações por e-mail para os alunos selecionados.
 * Body esperado: { sheetName, type, messageTemplate, dueDate, selectedStudents }
 */
router.post('/send', async (req, res) => {
  try {
    const { sheetName, type, messageTemplate, dueDate, selectedStudents } = req.body;

    if (!sheetName || !messageTemplate || !selectedStudents || !selectedStudents.length) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: sheetName, messageTemplate e selectedStudents.',
      });
    }

    // Busca os dados da aba para obter os e-mails dos alunos selecionados
    const data = await sheetsService.getMatriculadosData(sheetName);
    const students = data.students || [];

    const studentsToEmail = students.filter(s => selectedStudents.includes(s.name) && s.email);

    if (studentsToEmail.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum dos alunos selecionados possui um e-mail válido.',
      });
    }

    // Função que processa os emails em segundo plano
    const sendEmailsInBackground = async () => {
      console.log(`[Background] Iniciando envio de ${studentsToEmail.length} e-mails...`);
      for (const student of studentsToEmail) {
        // Substitui as tags pelo conteúdo real
        let finalMessage = messageTemplate.replace(/<nome>/g, student.name);
        finalMessage = finalMessage.replace(/<nome do aluno>/g, student.name);
        finalMessage = finalMessage.replace(/<data de pagamento>/gi, dueDate || '[Data Não Informada]');

        // Constrói o HTML (bem básico, mas mantém quebras de linha)
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2 style="color: #1E88D9;">Prepara UMADSAL</h2>
            <p>${finalMessage.replace(/\n/g, '<br>')}</p>
            <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
            <p style="font-size: 0.8rem; color: #777;">Esta é uma mensagem automática, por favor não responda a este e-mail.</p>
          </div>
        `;

        let subject = 'Notificação Prepara UMADSAL';
        if (type === 'lembrete') subject = 'Lembrete de Pagamento - Prepara UMADSAL';
        if (type === 'atraso') subject = 'Aviso de Atraso - Prepara UMADSAL';

        try {
          await emailService.sendNotification(student.email, subject, htmlBody);
          // Pequeno delay entre e-mails para evitar bloqueio anti-spam do Google
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.error(`[Background] Falha ao enviar para ${student.name}:`, err.message);
        }
      }
      console.log(`[Background] Fim do envio de e-mails.`);
    };

    // Inicia a execução sem bloquear a requisição (fire and forget)
    sendEmailsInBackground();

    // Retorna imediatamente para o frontend não tomar timeout
    res.json({
      success: true,
      message: `O envio para ${studentsToEmail.length} aluno(s) foi iniciado. Isso pode demorar alguns minutos em segundo plano.`,
      results: []
    });
  } catch (error) {
    console.error('Erro ao enviar notificações:', error);
    res.status(500).json({
      success: false,
      error: 'Ocorreu um erro interno ao enviar as notificações.',
      details: error.message
    });
  }
});

/**
 * POST /api/notifications/send-whatsapp
 * Envia notificações por WhatsApp (Callmebot) para os alunos selecionados.
 * 
 * Modo Teste: busca alunos da aba definida em WPP_TEST_SHEET_NAME (ex: "TESTE NOTIFICACAO WPP")
 *             que contém apenas os números de teste, assim nenhum aluno real recebe.
 * Modo Normal: busca números da coluna "Celular:" da aba informada.
 * 
 * Body esperado: { sheetName, messageTemplate, dueDate, selectedStudents }
 */
router.post('/send-whatsapp', async (req, res) => {
  try {
    const { sheetName, messageTemplate, dueDate, selectedStudents } = req.body;

    if (!sheetName || !messageTemplate || !selectedStudents || !selectedStudents.length) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: sheetName, messageTemplate e selectedStudents.',
      });
    }

    // ---- Verifica modo de teste ----
    const isTestMode = process.env.WPP_TEST_MODE !== 'false';

    let studentsToSend = [];

    if (isTestMode) {
      // No modo teste, usa os alunos/números da aba de teste (ex: "TESTE NOTIFICACAO WPP")
      const testSheetName = process.env.WPP_TEST_SHEET_NAME || 'TESTE NOTIFICACAO WPP';
      console.log(`[WPP] Modo TESTE ativo — usando aba: "${testSheetName}"`);

      const testData = await sheetsService.getMatriculadosData(testSheetName);
      const testStudents = testData.students || [];

      // No modo teste, cria uma mensagem de teste para CADA aluno selecionado
      // e envia para TODOS os números cadastrados na aba de teste.
      const testNumbers = testStudents.filter(s => s.phone).map(s => s.phone);

      selectedStudents.forEach(selectedName => {
        testNumbers.forEach(tPhone => {
          studentsToSend.push({
            name: selectedName, // O nome da pessoa que estamos simulando
            phone: tPhone,      // O telefone de destino (o testador)
            originalName: selectedName
          });
        });
      });

      if (studentsToSend.length === 0) {
        return res.status(400).json({
          success: false,
          error: `Nenhum número encontrado na aba de teste "${testSheetName}". Verifique se a aba existe e tem a coluna "Celular:".`,
        });
      }
    } else {
      // Modo normal: busca os números dos alunos selecionados na aba real
      const data = await sheetsService.getMatriculadosData(sheetName);
      const students = data.students || [];

      studentsToSend = students
        .filter(s => selectedStudents.includes(s.name) && s.phone)
        .map(s => ({
          name: s.name,
          phone: s.phone,
          originalName: s.name,
        }));

      if (studentsToSend.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Nenhum dos alunos selecionados possui um número de celular válido.',
        });
      }
    }

    const results = [];
    let sentCount = 0;
    let failCount = 0;

    // Callmebot tem limite de taxa — adiciona delay entre envios para evitar bloqueio
    const DELAY_MS = 1500; // 1,5 segundos entre mensagens

    for (let i = 0; i < studentsToSend.length; i++) {
      const student = studentsToSend[i];

      // Determina o nome a ser usado na mensagem
      const displayName = student.originalName;

      // Substitui as tags pelo conteúdo real
      let finalMessage = messageTemplate.replace(/<nome>/gi, displayName);
      finalMessage = finalMessage.replace(/<nome do aluno>/gi, displayName);
      finalMessage = finalMessage.replace(/<data de pagamento>/gi, dueDate || '[Data Não Informada]');

      // Prefixo em modo teste
      if (isTestMode) {
        finalMessage = `🧪 [TESTE - Dest. Original: ${displayName}]\n\n${finalMessage}`;
      }

      try {
        const result = await whatsappService.sendWhatsApp(student.phone, finalMessage);

        if (result.success) {
          results.push({ name: student.name, phone: student.phone, success: true, mock: result.mock });
          sentCount++;
        } else {
          results.push({ name: student.name, phone: student.phone, success: false, error: result.error });
          failCount++;
        }
      } catch (err) {
        results.push({ name: student.name, phone: student.phone, success: false, error: err.message });
        failCount++;
      }

      // Delay entre mensagens (exceto na última)
      if (i < studentsToSend.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }

    const modeLabel = isTestMode ? ' (Modo Teste)' : '';
    res.json({
      success: true,
      message: `${sentCount} mensagem(s) WhatsApp enviada(s)${modeLabel}.${failCount > 0 ? ` ${failCount} falhou(ram).` : ''}`,
      testMode: isTestMode,
      results
    });
  } catch (error) {
    console.error('Erro ao enviar notificações WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Ocorreu um erro interno ao enviar as notificações WhatsApp.',
      details: error.message
    });
  }
});

module.exports = router;
