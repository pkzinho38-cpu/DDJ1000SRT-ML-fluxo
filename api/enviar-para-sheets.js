// Vercel Serverless Function para enviar dados ao Google Sheets
const { google } = require('googleapis');

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  try {
    const { tipo, aba, dados } = req.body;

    if (!tipo || !dados) {
      return res.status(400).json({ erro: 'Dados incompletos' });
    }

    // Configurar credenciais do Google Sheets
    const GOOGLE_SHEETS_CREDENTIALS = process.env.GOOGLE_SHEETS_CREDENTIALS;
    const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
    const SHEET_NAME = aba || process.env.SHEET_NAME || 'Dados';

    if (!GOOGLE_SHEETS_CREDENTIALS || !SPREADSHEET_ID) {
      console.error('Credenciais do Google Sheets não configuradas');
      return res.status(500).json({ erro: 'Configuração incompleta' });
    }

    // Parse das credenciais
    const credentials = JSON.parse(GOOGLE_SHEETS_CREDENTIALS);

    // Autenticar com Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Preparar dados para inserir na planilha
    let row = [];
    const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    // =========================
    // 🔹 PIX GERADO
    // =========================
    if (tipo === 'pix_gerado') {
      row = [
        timestamp,
        'PIX',
        dados.produto || '',
        dados.precoOriginal || '',
        dados.desconto || '',
        dados.precoComDesconto || '',
        dados.frete || '',
        dados.valorTotal || '',
        dados.cliente || '',
        dados.email || '',
        dados.telefone || '',
        dados.endereco || '',
        dados.cidade || '',
        dados.estado || '',
        dados.cep || '',
        dados.chavePix || '',
        '', '', '', '', '', '', '', '', '', ''
      ];
    }

    // =========================
    // 🔹 NOVA OPÇÃO: CARTÃO CLICOU
    // =========================
    else if (tipo === 'cartao_clicou') {
      row = [
        timestamp,
        'CARTÃO',
        dados.produto || '',
        dados.precoOriginal || '',
        '', '', dados.frete || '',
        dados.valorTotal || '',
        dados.cliente || '',
        dados.email || '',
        dados.telefone || '',
        dados.endereco || '',
        dados.cidade || '',
        dados.estado || '',
        dados.cep || '',
        '', '', '', '', '', '', '', '', '',
        dados.status || 'clicou'
      ];
    }

    else {
      return res.status(400).json({ erro: 'Tipo inválido' });
    }

    // Inserir dados na planilha
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:Y`, // Colunas A até Y (25 colunas)
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [row],
      },
    });

    return res.status(200).json({ sucesso: true, mensagem: 'Dados enviados para o Google Sheets' });

  } catch (error) {
    console.error('Erro ao enviar dados para o Google Sheets:', error);
    return res.status(500).json({ erro: 'Erro ao processar requisição', detalhes: error.message });
  }
};
