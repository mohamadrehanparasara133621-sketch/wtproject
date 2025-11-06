
// Basic SPA-like helpers (but pages are separate)
(function(){
  const path = window.location.pathname;
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(a=>{
    const href = new URL(a.href, window.location.origin).pathname;
    if (href === path) a.classList.add('active');
  });

  // Cart state in localStorage
  const CART_KEY = 'zc_cart';
  const USERS_KEY = 'zc_users';
  const REST_KEY = 'zc_restaurants';
  const ORDERS_KEY = 'zc_orders';

  const sampleRestaurants = [
    {id:1, name:'Spice Route', rating:4.4, cuisine:'North Indian', price:'₹₹',  src:"https://b.zmtcdn.com/data/pictures/chains/6/102186/106bdb3a2a9079d3ec01ceb1a9f160bb.jpg?fit=around|750:500&crop=750:500;*,*", area:'HSR Layout'},
    {id:2, name:'Sushi Zen', rating:4.7, cuisine:'Japanese', price:'₹₹₹', img:'../assets/images/placeholder.svg', area:'Indiranagar'},
    {id:3, name:'Burger Hub', rating:4.2, cuisine:'Fast Food', price:'₹', img:'../assets/images/placeholder.svg', area:'Koramangala'},
    {id:4, name:'Green Bowl', rating:4.5, cuisine:'Healthy', price:'₹₹', img:'../assets/images/placeholder.svg', area:'BTM'},
    {id:5, name:'Pasta Casa', rating:4.3, cuisine:'Italian', price:'₹₹', img:'../assets/images/placeholder.svg', area:'Whitefield'}
  ];
  // Put sample data once
  if (!localStorage.getItem(REST_KEY)) localStorage.setItem(REST_KEY, JSON.stringify(sampleRestaurants));

  function getCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY)||'[]'); }catch(e){ return [] } }
  function setCart(items){ localStorage.setItem(CART_KEY, JSON.stringify(items)); refreshCartBadge(); }
  function refreshCartBadge(){
    const count = getCart().reduce((a,b)=>a + (b.qty||1), 0);
    document.querySelectorAll('[data-cart-count]').forEach(el=> el.textContent = count);
  }
  window.Cart = {
    add(item){
      const cart = getCart();
      const idx = cart.findIndex(x=>x.id===item.id);
      if(idx>-1){ cart[idx].qty += (item.qty||1); } else { item.qty = item.qty||1; cart.push(item); }
      setCart(cart);
      alert('Added to cart');
    },
    remove(id){
      setCart(getCart().filter(x=>x.id!==id));
    },
    clear(){ setCart([]) },
    items:getCart
  };
  refreshCartBadge();

  // Page specific initializers
  const on = (sel, fn) => { if(document.querySelector(sel)) fn(); };
  // Restaurants list
  on('#restaurants-list', ()=>{
    const data = JSON.parse(localStorage.getItem(REST_KEY) || '[]');
    const wrap = document.querySelector('#restaurants-list');
    wrap.innerHTML = data.map(r=>`
      <a class="card" href="./restaurant-detail.html?id=${r.id}">
        <img class="thumb" src="${r.img}" alt="${r.name}"/>
        <div class="pad">
          <div class="row" style="justify-content:space-between">
            <strong>${r.name}</strong>
            <span class="badge">★ ${r.rating}</span>
          </div>
          <div class="sub">${r.cuisine} • ${r.price} • ${r.area}</div>
        </div>
      </a>
    `).join('');
  });

  // Restaurant detail (static sample menu)
  on('#restaurant-detail', ()=>{
    const params = new URLSearchParams(location.search);
    const id = parseInt(params.get('id')||'1',10);
    const r = (JSON.parse(localStorage.getItem(REST_KEY)||'[]').find(x=>x.id===id)) || sampleRestaurants[0];
    document.querySelector('[data-r-name]').textContent = r.name;
    document.querySelector('[data-r-meta]').textContent = `${r.cuisine} • ${r.price} • ${r.area}`;
    document.querySelector('[data-r-img]').src = r.img;

    const menu = [
      {id: id*10+1, title:'Paneer Tikka', price:220},
      {id: id*10+2, title:'Veg Biryani', price:180},
      {id: id*10+3, title:'Butter Naan', price:55},
      {id: id*10+4, title:'Masala Chai', price:35}
    ];
    const list = document.querySelector('#menu-list');
    list.innerHTML = menu.map(m=>`
      <div class="card">
        <div class="pad row" style="justify-content:space-between">
          <div>
            <strong>${m.title}</strong>
            <div class="sub">₹${m.price}</div>
          </div>
          <button class="btn primary" data-add="${m.id}">Add</button>
        </div>
      </div>
    `).join('');

    list.addEventListener('click', (e)=>{
      const idAttr = e.target.getAttribute('data-add');
      if(!idAttr) return;
      const item = menu.find(x=> String(x.id)===String(idAttr));
      Cart.add({id:item.id, name:item.title, price:item.price, qty:1});
    });
  });

  // Cart page
  on('#cart-page', ()=>{
    const table = document.querySelector('#cart-body');
    function render(){
      const items = Cart.items();
      if(!items.length){
        table.innerHTML = `<tr><td colspan="4" class="sub">Your cart is empty.</td></tr>`;
        document.querySelector('[data-cart-total]').textContent = '₹0';
        return;
      }
      let total = 0;
      table.innerHTML = items.map(it=>{
        const line = it.price * it.qty;
        total += line;
        return `<tr>
          <td>${it.name}</td>
          <td>₹${it.price}</td>
          <td>${it.qty}</td>
          <td>
            <div class="row">
              <span>₹${line}</span>
              <button class="btn" data-remove="${it.id}">Remove</button>
            </div>
          </td>
        </tr>`
      }).join('');
      document.querySelector('[data-cart-total]').textContent = '₹'+total;
    }
    render();
    table.addEventListener('click',(e)=>{
      const idAttr = e.target.getAttribute('data-remove');
      if(!idAttr) return;
      Cart.remove(parseInt(idAttr,10));
      render();
    });
    document.querySelector('#clear-cart').addEventListener('click', ()=>{ Cart.clear(); render(); });
  });

  // Simple admin page enhancements (counts)
  on('#admin-dashboard', ()=>{
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY)||'[]');
    const users = JSON.parse(localStorage.getItem(USERS_KEY)||'[{"id":1,"name":"Guest"}]');
    const rest = JSON.parse(localStorage.getItem(REST_KEY)||'[]');
    document.querySelector('[data-a-orders]').textContent = orders.length;
    document.querySelector('[data-a-users]').textContent = users.length;
    document.querySelector('[data-a-rest]').textContent = rest.length;
    document.querySelector('[data-a-rev]').textContent = '₹' + (orders.reduce((a,b)=>a+(b.total||0),0));
  });
})();
