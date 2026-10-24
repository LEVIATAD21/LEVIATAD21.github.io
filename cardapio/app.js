"use strict";
const PRODUCTS = [
  {id:"entrada-verde",name:"Salada da estação",category:"Entradas",description:"Folhas frescas, crocância e um molho leve da casa.",price:18.90,unit:"porção",tag:"Leve e fresca",image:"photo-1546069901-ba9599a7e63c"},
  {id:"bruschetta",name:"Bruschetta rústica",category:"Entradas",description:"Tomate, ervas frescas e pão tostado na medida.",price:16.50,unit:"3 unidades",tag:"Favorito",image:"photo-1547592180-85f173990554"},
  {id:"massa",name:"Pasta ao pesto",category:"Pratos",description:"Massa envolvida em pesto aromático e parmesão.",price:32.90,unit:"prato",tag:"Em destaque",image:"photo-1476224203421-9ac39bcb3327"},
  {id:"bowl",name:"Bowl colorido",category:"Pratos",description:"Grãos, vegetais e ingredientes cheios de textura.",price:28.50,unit:"bowl",tag:"Equilibrado",image:"photo-1512621776951-a57141f2eefd"},
  {id:"pizza",name:"Pizza artesanal",category:"Pratos",description:"Massa dourada, molho da casa e queijo derretido.",price:39.90,unit:"pizza individual",tag:"Queridinho",image:"photo-1565299624946-b28f40a0ae38"},
  {id:"suco",name:"Suco natural",category:"Bebidas",description:"Fruta, frescor e nada de complicação.",price:9.50,unit:"copo 300 ml",tag:"Refrescante",image:"photo-1622597467836-f3285f2131b8"},
  {id:"cafe",name:"Café especial",category:"Bebidas",description:"Aroma marcante para uma pausa bem aproveitada.",price:7.00,unit:"xícara",tag:"Clássico",image:"photo-1509042239860-f550ce710b93"},
  {id:"bolo",name:"Bolo de chocolate",category:"Sobremesas",description:"Camadas macias para fechar a refeição com doçura.",price:14.00,unit:"fatia",tag:"Doce favorito",image:"photo-1578985545062-69928b1d9587"},
  {id:"pudim",name:"Pudim cremoso",category:"Sobremesas",description:"Textura delicada e caramelo em cada colherada.",price:12.50,unit:"fatia",tag:"Feito para dividir",image:"photo-1488477181946-6428a0291777"},
  {id:"salada-especial",name:"Salada mediterrânea",category:"Entradas",description:"Tomate, folhas, azeitonas e um toque cítrico.",price:21.90,unit:"porção",tag:"Vegetariano",image:"photo-1540189549336-e6e99c3679fe"},
  {id:"prato-casa",name:"Prato da estação",category:"Pratos",description:"Uma composição vibrante com ingredientes da estação.",price:34.90,unit:"prato",tag:"Novidade",image:"photo-1546549032-9571cd6b27df"},
  {id:"limonada",name:"Limonada fresca",category:"Bebidas",description:"Cítrica, geladinha e feita para refrescar.",price:8.50,unit:"copo 300 ml",tag:"Refrescante",image:"photo-1513558161293-cdaf765edfd4"}
];
const CATEGORIES = [
  {name:"Todos",icon:"✳",description:"Tudo em um só lugar"},
  {name:"Entradas",icon:"🥑",description:"Para abrir o apetite"},
  {name:"Pratos",icon:"🍝",description:"Escolhas para saborear"},
  {name:"Bebidas",icon:"🥤",description:"Um brinde ao momento"},
  {name:"Sobremesas",icon:"🍰",description:"Um final feliz"}
];
const state = {category:"Todos",query:"",sort:"featured",cart:{},favorites:new Set(),activeProduct:null,toastTimer:null,previousFocus:null};
const money = new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"});
const byId = (id) => document.getElementById(id);
const productImage = (product,width) => "https://images.unsplash.com/" + product.image + "?auto=format&fit=crop&w=" + (width || 640) + "&q=82";
const escapeHTML = (value) => String(value == null ? "" : value).replace(/[&<>"']/g,(character)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]));
const findProduct = (id) => PRODUCTS.find((product)=>product.id===id);
const cartItems = () => Object.keys(state.cart).map((id)=>({product:findProduct(id),qty:state.cart[id]})).filter((item)=>item.product && item.qty>0);
const cartCount = () => cartItems().reduce((sum,item)=>sum+item.qty,0);
const cartTotal = () => cartItems().reduce((sum,item)=>sum+item.product.price*item.qty,0);

function showToast(message){
  const node=byId("toast");
  node.textContent=message;
  node.hidden=false;
  window.clearTimeout(state.toastTimer);
  state.toastTimer=window.setTimeout(()=>{node.hidden=true;},3600);
}
function setCategory(category){
  state.category=category;
  renderCategories();
  renderFilters();
  renderProducts();
  byId("cardapio").scrollIntoView({behavior:"smooth",block:"start"});
}
function renderCategories(){
  byId("categoryList").innerHTML=CATEGORIES.map((category)=>(
    '<button class="category-card'+(state.category===category.name?' active':'')+'" type="button" data-category="'+escapeHTML(category.name)+'" aria-pressed="'+(state.category===category.name)+'">'+
      '<span class="category-icon" aria-hidden="true">'+category.icon+'</span><span><strong>'+escapeHTML(category.name==="Todos"?"Ver tudo":category.name)+'</strong><small>'+escapeHTML(category.description)+'</small></span></button>'
  )).join("");
}
function renderFilters(){
  byId("filterList").innerHTML=CATEGORIES.map((category)=>(
    '<button type="button" class="filter-button'+(state.category===category.name?' active':'')+'" data-category="'+escapeHTML(category.name)+'" aria-pressed="'+(state.category===category.name)+'">'+escapeHTML(category.name)+'</button>'
  )).join("");
}
function matchingProducts(){
  const query=state.query.trim().toLocaleLowerCase("pt-BR");
  let products=PRODUCTS.filter((product)=>{
    const categoryMatches=state.category==="Todos" || product.category===state.category;
    const queryMatches=!query || (product.name+" "+product.category+" "+product.description+" "+product.tag).toLocaleLowerCase("pt-BR").includes(query);
    return categoryMatches && queryMatches;
  });
  if(state.sort==="price-asc")products=products.slice().sort((a,b)=>a.price-b.price);
  else if(state.sort==="price-desc")products=products.slice().sort((a,b)=>b.price-a.price);
  else if(state.sort==="name")products=products.slice().sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
  return products;
}
function productCard(product){
  const favorite=state.favorites.has(product.id);
  const quantity=state.cart[product.id]||0;
  return '<article class="product-card">'+
    '<div class="product-image-wrap"><img class="product-image" src="'+productImage(product,640)+'" alt="'+escapeHTML(product.name)+'" loading="lazy">'+
    '<span class="product-badge">'+escapeHTML(product.tag)+'</span>'+
    '<button type="button" class="favorite-button'+(favorite?' active':'')+'" data-action="favorite" data-id="'+product.id+'" aria-label="'+(favorite?'Remover dos favoritos':'Adicionar aos favoritos')+': '+escapeHTML(product.name)+'" aria-pressed="'+favorite+'">'+(favorite?'♥':'♡')+'</button></div>'+
    '<div class="product-copy"><div class="product-meta"><span>'+escapeHTML(product.category)+'</span><span>✳ DEMO</span></div>'+
    '<h3 class="product-title">'+escapeHTML(product.name)+'</h3><p class="product-description">'+escapeHTML(product.description)+'</p>'+
    '<div class="product-bottom"><span class="product-price">'+money.format(product.price)+'<small class="product-unit">'+escapeHTML(product.unit)+'</small></span>'+
    (quantity?'<button type="button" class="add-button" data-action="add" data-id="'+product.id+'" aria-label="Adicionar mais '+escapeHTML(product.name)+'">'+quantity+' +</button>':'<button type="button" class="add-button" data-action="add" data-id="'+product.id+'" aria-label="Adicionar '+escapeHTML(product.name)+' à sacola">+</button>')+
    '</div></div><button type="button" class="product-detail-hit" data-action="details" data-id="'+product.id+'" aria-label="Ver detalhes de '+escapeHTML(product.name)+'"></button></article>';
}
function renderProducts(){
  const products=matchingProducts();
  byId("productGrid").innerHTML=products.map(productCard).join("");
  byId("productGrid").hidden=products.length===0;
  byId("emptyState").hidden=products.length!==0;
  byId("resultsLabel").textContent=products.length+" "+(products.length===1?"item encontrado":"itens encontrados")+(state.category!=="Todos"?" em "+state.category:"")+(state.query?' para “'+state.query+'”':"");
}
function renderCart(){
  const items=cartItems();
  byId("cartCount").textContent=String(cartCount());
  if(items.length===0){
    byId("cartContent").innerHTML='<div class="cart-empty"><span aria-hidden="true">▱</span><h3>Sua sacola está vazia</h3><p>Explore o cardápio e adicione algo que chamou sua atenção.</p><button type="button" class="button button-primary" data-action="continue-shopping">Explorar cardápio ↗</button></div>';
    byId("drawerFooter").innerHTML='<p class="drawer-note">Protótipo de portfólio · não há pedidos nem pagamentos reais.</p>';
    return;
  }
  byId("cartContent").innerHTML=items.map((item)=>(
    '<div class="cart-line"><img src="'+productImage(item.product,180)+'" alt="" loading="lazy"><div><p class="cart-line-name">'+escapeHTML(item.product.name)+'</p><p class="cart-line-price">'+money.format(item.product.price)+' / '+escapeHTML(item.product.unit)+'</p><div class="qty-controls"><button type="button" data-action="decrease" data-id="'+item.product.id+'" aria-label="Diminuir '+escapeHTML(item.product.name)+'">−</button><span>'+item.qty+'</span><button type="button" data-action="add" data-id="'+item.product.id+'" aria-label="Aumentar '+escapeHTML(item.product.name)+'">+</button></div></div><span class="cart-line-total">'+money.format(item.product.price*item.qty)+'</span></div>'
  )).join("");
  byId("drawerFooter").innerHTML='<div class="drawer-total"><span>Total ilustrativo</span><strong>'+money.format(cartTotal())+'</strong></div><button type="button" class="button button-primary" id="reviewOrder">Revisar sacola <span aria-hidden="true">↗</span></button><p class="drawer-note">Nenhum pedido será enviado. Valores apenas demonstrativos.</p>';
  byId("reviewOrder").addEventListener("click",openCheckout);
}
function changeQuantity(id,delta){
  const product=findProduct(id);
  if(!product)return;
  const next=Math.max(0,Math.min(20,(state.cart[id]||0)+delta));
  if(next)state.cart[id]=next;else delete state.cart[id];
  renderCart();
  renderProducts();
}
function openCart(){
  state.previousFocus=document.activeElement;
  byId("overlay").hidden=false;
  byId("cartDrawer").hidden=false;
  document.body.classList.add("locked");
  byId("closeCart").focus();
}
function closeCart(){
  byId("overlay").hidden=true;
  byId("cartDrawer").hidden=true;
  document.body.classList.remove("locked");
  if(state.previousFocus && typeof state.previousFocus.focus==="function")state.previousFocus.focus();
}
function openProduct(id){
  const product=findProduct(id);
  if(!product)return;
  state.activeProduct=id;
  state.previousFocus=document.activeElement;
  byId("productModalContent").innerHTML='<img class="modal-product-image" src="'+productImage(product,1000)+'" alt="'+escapeHTML(product.name)+'"><div class="modal-product-copy"><div class="product-meta"><span>'+escapeHTML(product.category)+'</span><span>'+escapeHTML(product.tag)+'</span></div><h2 id="modalTitle">'+escapeHTML(product.name)+'</h2><p>'+escapeHTML(product.description)+' Esta descrição e a imagem fazem parte de um conteúdo fictício de demonstração.</p><div class="modal-product-footer"><strong>'+money.format(product.price)+'<small class="product-unit">'+escapeHTML(product.unit)+'</small></strong><button type="button" class="button button-primary" data-action="add-modal" data-id="'+product.id+'">Adicionar à sacola +</button></div></div>';
  byId("productModal").hidden=false;
  document.body.classList.add("locked");
  byId("productModal").querySelector(".close-button").focus();
}
function openCheckout(){
  const items=cartItems();
  if(!items.length){showToast("Adicione um item antes de revisar a sacola.");return;}
  byId("checkoutSummary").innerHTML=items.map((item)=>'<div class="checkout-row"><span>'+item.qty+' × '+escapeHTML(item.product.name)+'</span><strong>'+money.format(item.product.price*item.qty)+'</strong></div>').join("");
  updateCheckoutTotal();
  byId("checkoutModal").hidden=false;
  document.body.classList.add("locked");
  byId("checkoutModal").querySelector(".close-button").focus();
}
function updateCheckoutTotal(){
  const delivery=byId("serviceMethod").value==="entrega"?5.90:0;
  byId("checkoutTotal").textContent=money.format(cartTotal()+delivery);
}
function closeModal(modal){
  modal.hidden=true;
  if(byId("checkoutModal").hidden && byId("productModal").hidden && byId("cartDrawer").hidden)document.body.classList.remove("locked");
  if(state.previousFocus && typeof state.previousFocus.focus==="function")state.previousFocus.focus();
}
function closeAllModals(){
  closeCart();
  byId("productModal").hidden=true;
  byId("checkoutModal").hidden=true;
  byId("overlay").hidden=true;
  document.body.classList.remove("locked");
}
function handleAction(action,id){
  if(action==="add"){changeQuantity(id,1);const product=findProduct(id);if(product)showToast(product.name+" adicionado à sacola demonstrativa.");}
  else if(action==="decrease")changeQuantity(id,-1);
  else if(action==="favorite"){
    if(state.favorites.has(id)){state.favorites.delete(id);showToast("Item removido dos favoritos.");}
    else{state.favorites.add(id);showToast("Item salvo nos favoritos desta sessão.");}
    renderProducts();
  }else if(action==="details")openProduct(id);
  else if(action==="add-modal"){changeQuantity(id,1);byId("productModal").hidden=true;document.body.classList.remove("locked");showToast("Item adicionado à sacola demonstrativa.");}
  else if(action==="continue-shopping"){closeCart();byId("cardapio").scrollIntoView({behavior:"smooth"});}
}
byId("categoryList").addEventListener("click",(event)=>{
  const button=event.target.closest("[data-category]");
  if(button)setCategory(button.dataset.category);
});
byId("filterList").addEventListener("click",(event)=>{
  const button=event.target.closest("[data-category]");
  if(button){state.category=button.dataset.category;renderCategories();renderFilters();renderProducts();}
});
byId("productGrid").addEventListener("click",(event)=>{
  const button=event.target.closest("[data-action]");
  if(button){event.stopPropagation();handleAction(button.dataset.action,button.dataset.id);return;}
  const card=event.target.closest(".product-card");
  if(card){const index=Array.from(byId("productGrid").children).indexOf(card);const product=matchingProducts()[index];if(product)openProduct(product.id);}
});
byId("cartContent").addEventListener("click",(event)=>{
  const button=event.target.closest("[data-action]");
  if(button)handleAction(button.dataset.action,button.dataset.id);
});
byId("productModalContent").addEventListener("click",(event)=>{
  const button=event.target.closest("[data-action]");
  if(button)handleAction(button.dataset.action,button.dataset.id);
});
byId("searchInput").addEventListener("input",(event)=>{state.query=event.target.value;renderProducts();});
byId("sortSelect").addEventListener("change",(event)=>{state.sort=event.target.value;renderProducts();});
byId("clearFilters").addEventListener("click",()=>{
  state.category="Todos";state.query="";state.sort="featured";
  byId("searchInput").value="";byId("sortSelect").value="featured";
  renderCategories();renderFilters();renderProducts();
});
byId("openCart").addEventListener("click",openCart);
byId("closeCart").addEventListener("click",closeCart);
byId("overlay").addEventListener("click",closeCart);
document.querySelectorAll("[data-close-modal]").forEach((button)=>button.addEventListener("click",()=>closeModal(button.closest(".modal-shell"))));
byId("serviceMethod").addEventListener("change",updateCheckoutTotal);
byId("simulateOrder").addEventListener("click",()=>{
  byId("checkoutModal").hidden=true;
  byId("cartDrawer").hidden=true;
  byId("overlay").hidden=true;
  document.body.classList.remove("locked");
  showToast("Simulação concluída. Nenhum pedido, dado ou pagamento foi enviado.");
});
byId("mobileMenuButton").addEventListener("click",()=>{
  const nav=byId("mobileNav");
  nav.hidden=!nav.hidden;
  byId("mobileMenuButton").setAttribute("aria-expanded",String(!nav.hidden));
  byId("mobileMenuButton").setAttribute("aria-label",nav.hidden?"Abrir menu":"Fechar menu");
  byId("mobileMenuButton").textContent=nav.hidden?"☰":"×";
});
byId("mobileNav").querySelectorAll("a").forEach((link)=>link.addEventListener("click",()=>{
  byId("mobileNav").hidden=true;
  byId("mobileMenuButton").setAttribute("aria-expanded","false");
  byId("mobileMenuButton").setAttribute("aria-label","Abrir menu");
  byId("mobileMenuButton").textContent="☰";
}));
document.querySelector(".search-box").addEventListener("click",(event)=>{
  const box=event.currentTarget;
  if(window.matchMedia("(max-width: 560px)").matches && event.target.tagName!=="INPUT" && !box.classList.contains("open")){
    event.preventDefault();box.classList.add("open");byId("searchInput").focus();
  }
});
document.addEventListener("keydown",(event)=>{
  if(event.key==="Escape"){
    closeAllModals();
    byId("mobileNav").hidden=true;
    byId("mobileMenuButton").setAttribute("aria-expanded","false");
    byId("mobileMenuButton").textContent="☰";
  }
});
document.querySelectorAll('a[href="#cardapio"]').forEach((link)=>link.addEventListener("click",()=>{
  byId("mobileNav").hidden=true;
  byId("mobileMenuButton").setAttribute("aria-expanded","false");
}));

function openScreen(name){
  state.previousFocus=document.activeElement;
  const content=byId("screenModalContent");
  const templates={
    favorites:()=>'<p class="eyebrow">SUA LISTA PESSOAL</p><h2 id="screenTitle">Seus favoritos<span class="heading-period">.</span></h2><p class="screen-lead">Itens que você marcou com carinho nesta sessão.</p><div class="screen-product-grid">'+PRODUCTS.filter(p=>state.favorites.has(p.id)).map(productCard).join("")+'</div>'+(state.favorites.size?'':'<div class="screen-empty"><span>♡</span><h3>Nenhum favorito por enquanto</h3><p>Toque no coração de um item para salvá-lo nesta sessão.</p><button class="button button-primary" data-screen-action="browse">Explorar cardápio ↗</button></div>'),
    account:()=>'<p class="eyebrow">BEM-VINDO À MESA</p><h2 id="screenTitle">Sua conta<span class="heading-period">.</span></h2><p class="screen-lead">Esta tela demonstra uma futura área de cliente. Não crie uma senha real aqui.</p><form id="demoAccountForm" class="screen-form"><label>Seu nome<input name="name" autocomplete="name" placeholder="Como podemos chamar você?" maxlength="80" required></label><label>E-mail de demonstração<input name="email" type="email" autocomplete="off" placeholder="voce@exemplo.com" maxlength="120" required></label><button class="button button-primary button-full" type="submit">Visualizar minha área ↗</button></form><div class="screen-feature-list"><span>✓ Perfil de cliente (prévia)</span><span>✓ Endereços e preferências (em breve)</span><span>✓ Histórico de pedidos (em breve)</span></div><p class="privacy-note">Os dados digitados não são enviados nem armazenados. A página apenas mostra uma confirmação temporária.</p>',
    tracking:()=>'<p class="eyebrow">ACOMPANHAMENTO</p><h2 id="screenTitle">Acompanhe seu pedido<span class="heading-period">.</span></h2><p class="screen-lead">Digite um código fictício para visualizar a experiência de rastreamento.</p><form id="trackingForm" class="screen-form"><label>Código do pedido<input name="code" placeholder="Ex.: MESA-2026" maxlength="30" required></label><button class="button button-primary button-full" type="submit">Consultar demonstração ↗</button></form><div id="trackingResult" class="tracking-result" hidden></div><p class="privacy-note">Não existe processamento de pedidos reais neste protótipo.</p>',
    contact:()=>'<p class="eyebrow">FALE COM A GENTE</p><h2 id="screenTitle">Contato<span class="heading-period">.</span></h2><p class="screen-lead">Uma demonstração de formulário para futuras dúvidas, sugestões ou feedback.</p><form id="demoContactForm" class="screen-form"><label>Nome<input name="name" placeholder="Seu nome" maxlength="80" required></label><label>E-mail<input name="email" type="email" placeholder="voce@exemplo.com" maxlength="120" required></label><label>Mensagem<textarea name="message" rows="4" maxlength="500" placeholder="Como podemos ajudar?" required></textarea></label><button class="button button-primary button-full" type="submit">Pré-visualizar envio ↗</button></form><p class="privacy-note">O formulário não envia e-mail nem transmite informações.</p>',
    about:()=>'<p class="eyebrow">SOBRE A EXPERIÊNCIA</p><h2 id="screenTitle">Mais simples, à mesa<span class="heading-period">.</span></h2><p class="screen-lead">mesa. é um conceito independente de cardápio digital criado para demonstrar uma experiência de navegação clara, acessível e responsiva.</p><div class="screen-feature-list"><span>01 · Descoberta com busca e categorias</span><span>02 · Detalhes claros para cada item</span><span>03 · Sacola e revisão demonstrativas</span><span>04 · Interface adaptada a celular e computador</span></div><p class="privacy-note">Os produtos, preços, imagens e taxas são fictícios. Não representa um estabelecimento real.</p><button class="button button-primary" data-screen-action="browse">Explorar cardápio ↗</button>',
    privacy:()=>'<p class="eyebrow">TRANSPARÊNCIA</p><h2 id="screenTitle">Privacidade<span class="heading-period">.</span></h2><p class="screen-lead">Este protótipo funciona no navegador sem backend, contas reais ou envio de formulários.</p><div class="screen-feature-list"><span>✓ Nenhum pedido é enviado.</span><span>✓ Nenhum pagamento é processado.</span><span>✓ Formulários de demonstração não transmitem dados.</span><span>✓ Favoritos e sacola permanecem apenas na memória desta página.</span><span>✓ As fotografias ilustrativas são carregadas do Unsplash.</span></div>'
  };
  content.innerHTML=(templates[name]||templates.about)();
  byId("screenModal").hidden=false;
  document.body.classList.add("locked");
  byId("screenModal").querySelector(".close-button").focus();
  content.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>handleAction(button.dataset.action,button.dataset.id)));
  const accountForm=byId("demoAccountForm");
  if(accountForm)accountForm.addEventListener("submit",event=>{event.preventDefault();showToast("Prévia de conta exibida. Nenhum dado foi salvo.");closeModal(byId("screenModal"));});
  const contactForm=byId("demoContactForm");
  if(contactForm)contactForm.addEventListener("submit",event=>{event.preventDefault();showToast("Prévia do formulário concluída. Nada foi enviado.");closeModal(byId("screenModal"));});
  const trackingForm=byId("trackingForm");
  if(trackingForm)trackingForm.addEventListener("submit",event=>{
    event.preventDefault();
    const code=new FormData(trackingForm).get("code").toString().trim().toUpperCase().replace(/[^A-Z0-9-]/g,"").slice(0,30);
    const result=byId("trackingResult");
    result.hidden=false;
    result.innerHTML='<strong>Modo demonstração</strong><p>Código consultado: '+escapeHTML(code)+'</p><ol class="tracking-steps"><li class="done">Código recebido no formulário</li><li>Pedido aguardando integração com backend</li><li>Atualizações de entrega indisponíveis</li></ol><small>Este código não corresponde a um pedido real.</small>';
  });
  const browse=content.querySelector('[data-screen-action="browse"]');
  if(browse)browse.addEventListener("click",()=>{closeModal(byId("screenModal"));byId("cardapio").scrollIntoView({behavior:"smooth"});});
}
document.querySelectorAll("[data-open-screen]").forEach(button=>button.addEventListener("click",()=>openScreen(button.dataset.openScreen)));

renderCategories();
renderFilters();
renderProducts();
renderCart();
