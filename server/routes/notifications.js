const express = require('express');
const router = express.Router();
const emailService = require('../services/email.service');
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

    const results = [];
    let sentCount = 0;

    // Dispara e-mails
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
        results.push({ name: student.name, success: true });
        sentCount++;
      } catch (err) {
        results.push({ name: student.name, success: false, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `${sentCount} e-mail(s) processado(s).`,
      results
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

module.exports = router;
