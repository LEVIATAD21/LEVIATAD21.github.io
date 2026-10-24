/* mesa. sistema — dados de demonstração e persistência local
   Tudo roda no navegador (localStorage). Para produção, trocar por API/banco. */

const IMG = 'assets/img/';
const DB_KEY = 'mesa_system_v1';
const SESSION_KEY = 'mesa_session_v1';

const DEFAULT_SETTINGS = {
  brand: 'mesa.',
  supportName: 'Kawã',
  supportWhatsApp: '5521995078663',
  superPin: '9999',
  clientPin: '1234',
  rentPrice: 1000,
  buyMin: 3000,
  buyMax: 5000
};

function uid(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 9);
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function daysAgo(n, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  if (hour !== undefined) d.setHours(hour, minute || 0, 0, 0);
  return d.toISOString();
}

function buildSeed() {
  const clients = [
    {
      id: 'cli_pizzaria',
      slug: 'pizzaria-do-ze',
      name: 'Pizzaria do Zé',
      tagline: 'Pizza de forno a lenha, do jeito da Baixada.',
      description: 'Massa fermentada por 24h, ingredientes frescos e aquele forno a lenha que faz diferença. Delivery e retirada em Queimados.',
      logo: '🍕',
      cover: IMG + 'pizza.webp',
      whatsapp: '5521999990001',
      phone: '(21) 99999-0001',
      address: 'Rua das Palmeiras, 120 — Queimados/RJ',
      hours: 'Ter a Dom, 18h às 23h',
      plan: 'rent',
      monthly: 1000,
      salePrice: 0,
      domain: 'pizzariadoze.com.br',
      status: 'active',
      createdAt: daysAgo(42),
      accent: '#173f35'
    },
    {
      id: 'cli_boteco',
      slug: 'boteco-da-esquina',
      name: 'Boteco da Esquina',
      tagline: 'Comida de verdade, porção generosa e cerveja gelada.',
      description: 'O boteco de bairro que virou point: pratos executivos no almoço, petiscos à noite e aquele atendimento de sempre.',
      logo: '🍻',
      cover: IMG + 'prato-casa.webp',
      whatsapp: '5521999990002',
      phone: '(21) 99999-0002',
      address: 'Av. Central, 45 — Nilópolis/RJ',
      hours: 'Seg a Sáb, 11h às 23h',
      plan: 'buy',
      monthly: 0,
      salePrice: 4500,
      domain: 'botecodaesquina.com.br',
      status: 'active',
      createdAt: daysAgo(28),
      accent: '#8a5a2b'
    },
    {
      id: 'cli_doceria',
      slug: 'doceria-da-vila',
      name: 'Doceria da Vila',
      tagline: 'Bolos caseiros, doces finos e café passado na hora.',
      description: 'Uma doceria de bairro com receitas de família. Encomendas para festas, doces por quilo e café da tarde.',
      logo: '🧁',
      cover: IMG + 'bolo.webp',
      whatsapp: '5521999990003',
      phone: '(21) 99999-0003',
      address: 'Rua da Vila, 08 — Mesquita/RJ',
      hours: 'Seg a Sáb, 9h às 19h',
      plan: 'rent',
      monthly: 1000,
      salePrice: 0,
      domain: 'doceriadavila.com.br',
      status: 'active',
      createdAt: daysAgo(12),
      accent: '#a4556b'
    }
  ];

  const products = [
    // Pizzaria
    { id: 'pz_marg', clientId: 'cli_pizzaria', name: 'Pizza Margherita', description: 'Molho de tomate italiano, muçarela de búfala, manjericão fresco e azeite.', price: 49.9, category: 'Pizzas', image: IMG + 'pizza.webp', active: true, featured: true },
    { id: 'pz_cala', clientId: 'cli_pizzaria', name: 'Pizza Calabresa', description: 'Calabresa artesanal fatiada, cebola roxa, muçarela e orégano.', price: 54.9, category: 'Pizzas', image: IMG + 'pizza.webp', active: true, featured: true },
    { id: 'pz_quatro', clientId: 'cli_pizzaria', name: 'Pizza Quatro Queijos', description: 'Muçarela, provolone, gorgonzola e parmesão. Para quem não tem dúvida.', price: 59.9, category: 'Pizzas', image: IMG + 'pizza.webp', active: true, featured: false },
    { id: 'pz_brus', clientId: 'cli_pizzaria', name: 'Bruschetta da Casa', description: 'Pão de fermentação natural, tomate, alho, manjericão e azeite.', price: 24.9, category: 'Entradas', image: IMG + 'bruschetta.webp', active: true, featured: false },
    { id: 'pz_limao', clientId: 'cli_pizzaria', name: 'Limonada Suíça', description: 'Limão, leite condensado e gelo. 500 ml.', price: 14.9, category: 'Bebidas', image: IMG + 'limonada.webp', active: true, featured: false },
    { id: 'pz_pudim', clientId: 'cli_pizzaria', name: 'Pudim de Leite', description: 'Receita de família, calda de caramelo e raspas de limão.', price: 16.9, category: 'Sobremesas', image: IMG + 'pudim.webp', active: true, featured: false },

    // Boteco
    { id: 'bt_prato', clientId: 'cli_boteco', name: 'Prato da Casa', description: 'Arroz, feijão, bife acebolado, farofa e salada. O clássico do almoço.', price: 39.9, category: 'Pratos', image: IMG + 'prato-casa.webp', active: true, featured: true },
    { id: 'bt_bowl', clientId: 'cli_boteco', name: 'Bowl de Frango', description: 'Frango grelhado, arroz integral, legumes assados e molho da casa.', price: 34.9, category: 'Pratos', image: IMG + 'bowl.webp', active: true, featured: true },
    { id: 'bt_salada', clientId: 'cli_boteco', name: 'Salada Especial', description: 'Folhas frescas, tomate, cenoura, ovo e molho de mostarda e mel.', price: 27.9, category: 'Saladas', image: IMG + 'salada-especial.webp', active: true, featured: false },
    { id: 'bt_suco', clientId: 'cli_boteco', name: 'Suco Natural', description: 'Laranja, abacaxi ou maracujá. 400 ml, feito na hora.', price: 11.9, category: 'Bebidas', image: IMG + 'suco.webp', active: true, featured: false },
    { id: 'bt_bolo', clientId: 'cli_boteco', name: 'Fatia de Bolo', description: 'Bolo de cenoura com cobertura de chocolate.', price: 13.9, category: 'Sobremesas', image: IMG + 'bolo.webp', active: true, featured: false },

    // Doceria
    { id: 'dc_bolo', clientId: 'cli_doceria', name: 'Bolo de Cenoura', description: 'Bolo caseiro de cenoura com ganache de chocolate meio amargo.', price: 32.9, category: 'Bolos', image: IMG + 'bolo.webp', active: true, featured: true },
    { id: 'dc_pudim', clientId: 'cli_doceria', name: 'Pudim de Leite', description: 'Pudim cremoso com calda de caramelo. Fatia generosa.', price: 14.9, category: 'Sobremesas', image: IMG + 'pudim.webp', active: true, featured: true },
    { id: 'dc_cafe', clientId: 'cli_doceria', name: 'Café Passado', description: 'Café coado na hora, 200 ml. Acompanha biscoito de polvilho.', price: 7.9, category: 'Bebidas', image: IMG + 'cafe.webp', active: true, featured: false },
    { id: 'dc_limao', clientId: 'cli_doceria', name: 'Limonada', description: 'Limão, água e açúcar. 400 ml.', price: 10.9, category: 'Bebidas', image: IMG + 'limonada.webp', active: true, featured: false },
    { id: 'dc_brus', clientId: 'cli_doceria', name: 'Bruschetta Doce', description: 'Pão tostado, ricota, mel e frutas da estação.', price: 18.9, category: 'Salgados', image: IMG + 'bruschetta.webp', active: true, featured: false }
  ];

  const costs = [
    { id: 'c1', clientId: 'cli_pizzaria', description: 'Ingredientes da semana', category: 'Ingredientes', amount: 820, date: daysAgo(6) },
    { id: 'c2', clientId: 'cli_pizzaria', description: 'Embalagens de delivery', category: 'Embalagens', amount: 180, date: daysAgo(5) },
    { id: 'c3', clientId: 'cli_pizzaria', description: 'Gás e energia', category: 'Operação', amount: 140, date: daysAgo(3) },
    { id: 'c4', clientId: 'cli_pizzaria', description: 'Motoboy (diárias)', category: 'Entrega', amount: 220, date: daysAgo(2) },
    { id: 'c5', clientId: 'cli_boteco', description: 'Ingredientes da semana', category: 'Ingredientes', amount: 640, date: daysAgo(6) },
    { id: 'c6', clientId: 'cli_boteco', description: 'Embalagens', category: 'Embalagens', amount: 120, date: daysAgo(4) },
    { id: 'c7', clientId: 'cli_boteco', description: 'Equipe (diárias)', category: 'Equipe', amount: 900, date: daysAgo(2) },
    { id: 'c8', clientId: 'cli_doceria', description: 'Ingredientes da semana', category: 'Ingredientes', amount: 380, date: daysAgo(5) },
    { id: 'c9', clientId: 'cli_doceria', description: 'Embalagens e caixas', category: 'Embalagens', amount: 90, date: daysAgo(3) },
    { id: 'c10', clientId: 'cli_doceria', description: 'Energia', category: 'Operação', amount: 110, date: daysAgo(1) }
  ];

  const messages = [
    { id: 'm1', clientId: 'cli_pizzaria', source: 'admin', name: 'Zé — Pizzaria do Zé', phone: '5521999990001', subject: 'Trocar preço da Pizza Margherita', text: 'Kawã, quero subir a Margherita para R$ 52,90. Consegue fazer hoje?', status: 'new', createdAt: daysAgo(0, 10, 20), replies: [] },
    { id: 'm2', clientId: 'cli_pizzaria', source: 'site', name: 'Mariana', phone: '5521988880001', subject: 'Entrega no bairro São Roque', text: 'Vocês entregam no São Roque? Qual o valor da taxa?', status: 'new', createdAt: daysAgo(0, 9, 5), replies: [] },
    { id: 'm3', clientId: 'cli_pizzaria', source: 'admin', name: 'Zé — Pizzaria do Zé', phone: '5521999990001', subject: 'Foto da capa', text: 'Quero trocar a foto da capa por uma da pizza saindo do forno.', status: 'read', createdAt: daysAgo(1, 19, 40), replies: [] },
    { id: 'm4', clientId: 'cli_boteco', source: 'admin', name: 'Rita — Boteco da Esquina', phone: '5521999990002', subject: 'Novo prato no cardápio', text: 'Preciso cadastrar o prato do dia. Como faço pelo painel?', status: 'new', createdAt: daysAgo(0, 8, 15), replies: [] },
    { id: 'm5', clientId: 'cli_boteco', source: 'site', name: 'Carlos', phone: '5521977770002', subject: 'Pedido atrasado', text: 'Fiz um pedido às 12h e ainda não chegou. Consegue verificar?', status: 'replied', createdAt: daysAgo(1, 13, 10), replies: [{ text: 'Carlos, desculpe a demora. O motoboy já está com o pedido e chega em 10 minutos.', at: daysAgo(1, 13, 25) }] },
    { id: 'm6', clientId: 'cli_doceria', source: 'admin', name: 'Vila — Doceria da Vila', phone: '5521999990003', subject: 'Ativar o cardápio hoje', text: 'Consegue publicar o cardápio com os novos bolos ainda hoje?', status: 'new', createdAt: daysAgo(0, 7, 50), replies: [] },
    { id: 'm7', clientId: 'cli_doceria', source: 'site', name: 'Juliana', phone: '5521966660003', subject: 'Encomenda para festa', text: 'Queria um bolo para 30 pessoas no sábado. Tem como?', status: 'read', createdAt: daysAgo(2, 16, 30), replies: [] }
  ];

  const orders = [];
  clients.forEach((client, ci) => {
    const prods = products.filter(p => p.clientId === client.id && p.active);
    const rnd = mulberry32(20261024 + ci * 991);
    for (let d = 6; d >= 0; d--) {
      const count = 1 + Math.floor(rnd() * 3);
      for (let k = 0; k < count; k++) {
        const nItems = 1 + Math.floor(rnd() * 3);
        const items = [];
        for (let j = 0; j < nItems; j++) {
          const p = prods[Math.floor(rnd() * prods.length)];
          if (!p) continue;
          const found = items.find(i => i.productId === p.id);
          if (found) found.qty += 1;
          else items.push({ productId: p.id, name: p.name, price: p.price, qty: 1 });
        }
        if (!items.length) continue;
        const total = +items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2);
        const hour = 11 + Math.floor(rnd() * 11);
        const minute = Math.floor(rnd() * 60);
        const status = d === 0 && k === 0 ? 'novo' : d === 0 && k === 1 ? 'preparando' : 'entregue';
        orders.push({
          id: 'ped_' + client.id.slice(4) + '_' + d + '_' + k,
          clientId: client.id,
          items,
          total,
          cost: +(total * 0.38).toFixed(2),
          status,
          customerName: ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Felipe', 'Gabi', 'Hugo'][Math.floor(rnd() * 8)],
          customerPhone: '55219999' + String(10000 + Math.floor(rnd() * 89999)),
          method: rnd() > 0.4 ? 'entrega' : 'retirada',
          payment: ['Pix', 'Cartão', 'Dinheiro'][Math.floor(rnd() * 3)],
          createdAt: daysAgo(d, hour, minute)
        });
      }
    }
  });
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS },
    clients,
    products,
    orders,
    costs,
    messages
  };
}

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const db = JSON.parse(raw);
      if (db && db.version === 1 && Array.isArray(db.clients)) {
        db.settings = { ...DEFAULT_SETTINGS, ...(db.settings || {}) };
        return db;
      }
    }
  } catch (e) { /* ignora e recria */ }
  const db = buildSeed();
  saveDB(db);
  return db;
}

function saveDB(db) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) { console.warn('Falha ao salvar', e); }
}

function resetDB() {
  const db = buildSeed();
  saveDB(db);
  return db;
}

function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { return null; }
}

function setSession(session) {
  if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else sessionStorage.removeItem(SESSION_KEY);
}

function getClient(db, key) {
  return db.clients.find(c => c.id === key || c.slug === key) || null;
}

function clientProducts(db, clientId) {
  return db.products.filter(p => p.clientId === clientId);
}

function clientOrders(db, clientId) {
  return db.orders.filter(o => o.clientId === clientId);
}

function clientCosts(db, clientId) {
  return db.costs.filter(c => c.clientId === clientId);
}

function clientMessages(db, clientId) {
  return db.messages.filter(m => m.clientId === clientId);
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function inLastDays(iso, days) {
  const start = startOfDay(new Date());
  start.setDate(start.getDate() - (days - 1));
  return new Date(iso) >= start;
}

function computeStats(db, clientId, days = 7) {
  const orders = clientOrders(db, clientId).filter(o => inLastDays(o.createdAt, days) && o.status !== 'cancelado');
  const costs = clientCosts(db, clientId).filter(c => inLastDays(c.date, days));
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const costTotal = costs.reduce((s, c) => s + c.amount, 0);
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const unread = clientMessages(db, clientId).filter(m => m.status === 'new').length;

  const byProduct = {};
  orders.forEach(o => o.items.forEach(i => {
    byProduct[i.productId] = byProduct[i.productId] || { name: i.name, qty: 0, total: 0 };
    byProduct[i.productId].qty += i.qty;
    byProduct[i.productId].total += i.price * i.qty;
  }));
  const topProducts = Object.values(byProduct).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const daily = [];
  for (let d = days - 1; d >= 0; d--) {
    const day = new Date();
    day.setDate(day.getDate() - d);
    const key = day.toDateString();
    const value = orders.filter(o => new Date(o.createdAt).toDateString() === key)
      .reduce((s, o) => s + o.total, 0);
    daily.push({ label: day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''), value, date: key });
  }

  return {
    revenue,
    costTotal,
    profit: revenue - costTotal,
    ordersCount: orders.length,
    ticket: orders.length ? revenue / orders.length : 0,
    todayOrders: todayOrders.length,
    todayRevenue,
    unread,
    topProducts,
    daily,
    orders,
    costs
  };
}

function money(n) {
  return (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function shortDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function dateTime(iso) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return min + ' min';
  const h = Math.floor(min / 60);
  if (h < 24) return h + ' h';
  return Math.floor(h / 24) + ' d';
}

function escapeHTML(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function waLink(phone, text) {
  const digits = String(phone || '').replace(/\D/g, '');
  return 'https://wa.me/' + digits + '?text=' + encodeURIComponent(text || '');
}

function slugify(text) {
  return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/* Exposto para o app */
window.MesaData = {
  IMG, DB_KEY, SESSION_KEY, DEFAULT_SETTINGS,
  uid, loadDB, saveDB, resetDB, getSession, setSession,
  getClient, clientProducts, clientOrders, clientCosts, clientMessages,
  computeStats, money, shortDate, dateTime, timeAgo, escapeHTML, waLink, slugify, daysAgo
};
