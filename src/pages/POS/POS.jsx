import { useEffect, useState } from 'react';
import classes from './POS.module.css';
import api from '../../api/axios';
import { Activity, Banknote, CreditCard, LayoutGrid, Minus, Plus, ShoppingCart, Trash2, User } from 'lucide-react';
import Modal from '../../components/UI/Modal';
import { toast } from 'react-toastify';

function POSPage() {
  const [products,setProducts] = useState([]);
  const [categories,setCategories] = useState([]);
  const [customers,setCustomers] = useState([]);
  const [search,setSearch] = useState('');
  const [activeCat,setActiveCat] = useState('all');
  const [cart,setCart] = useState([]);
  const [loading,setLoading] = useState(true);
  const [applyTax, setApplyTax] = useState(true);
  const [orderStatus, setOrderStatus] = useState('completed');
  const [processing, setProcessing] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethods,setPaymentMethods] = useState('cash');
  const [cardReference, setCardReference] = useState('');

  const [modalOpen,setModalOpen] = useState(false);
  const [submitting,setSubmitting] = useState(false);
  const [submitCustomer,setSubmitCustomer] = useState(false);
  const [formDataCustomer,setFormDataCustomer] = useState({name: '', phone: '', email: ''});
  const [selectedCustomer,setSelectCustomer] = useState('');

  async function fetchData() {
    try {
      const [prodRes,catRes,custRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/customers')
      ]);

      setProducts(prodRes.data);
      setCategories(catRes.data);
      setCustomers(custRes.data);
    }catch(error) {
      console.log(error);
    }finally{
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  },[]);

  function addToCart(product,isPack= false) {
    const cartItemId = `${product.id}_${isPack ? 'pack' : 'unit'}`;
    const existing = cart.find((item) => item.cartItemId === cartItemId);
    const unitRatio = isPack && product.has_multi_unit ? (product.pack_qty || 1) : 1; 

    const currentTotalPhysicalInCart = cart.filter(i => i.id === product.id).reduce((sum, i) => sum + (i.quantity * i.unit_ratio),0);
    if((currentTotalPhysicalInCart + unitRatio) > product.stock) {
      toast.warning('لا يوجد مخزون كافي',{position: 'bottom-right',autoClose: 2000});
      return;
    }
    
    if(existing) {
      setCart(cart.map(item => item.cartItemId === cartItemId ? {...item, quantity: item.quantity + 1} : item));
    }else {
      const priceToUse = isPack ? parseFloat(product.pack_price) : parseFloat(product.price);
      const nameToUse = isPack ? `${product.name} (${product.pack_name || 'عبوة كبري'})` : product.name;

      setCart([...cart, 
        { ...product, 
          cartItemId, 
          is_pack: isPack, 
          price: priceToUse, 
          name: nameToUse, 
          unit_ratio: unitRatio,
          quantity: 1 
      }])
      toast.success('تمت اضافة المنتج بنجاح',{position: 'bottom-right', autoClose: 2000});
    };
  }

  function updateQuantity(cartItemId,delta) {
    setCart(cart.map(item => {
      if(item.cartItemId === cartItemId) {
        const productInfo = products.find(p => p.id === item.id);
        const newQ = item.quantity + delta;
        
        if(delta > 0) {
          const otherCartVariants = cart.filter(i => i.id === item.id && i.cartItemId !== cartItemId).reduce((sum, i) => sum + (i.quantity * i.unit_ratio), 0);
          const proposedTotalPhysical = (newQ * item.unit_ratio) + otherCartVariants;
          if(proposedTotalPhysical > productInfo.stock) {
              toast.warning("لا يوجد مخزون كافي، المتاح", { stock: productInfo.stock });
              return item;
          }
        }
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  function removeFromCart(cartItemId){
    setCart(cart.filter(item => item.cartItemId !== cartItemId));
  }


  async function handleAddNewCustomer(e) {
    e.preventDefault();
    setSubmitCustomer(true);
    try {
      const {data} = await api.post('/customers',formDataCustomer);
      setCustomers([...customers,data]);
      setSelectCustomer(data.id);
      setFormDataCustomer({ name: '', phone: '', email: '' })      
      setModalOpen(false);
      toast.success('تمت اضافو عميل',{position: 'bottom-right',autoClose: 2000})
    }catch(error) {
      toast.error('حدث خطأ',{position: 'bottom-right',autoClose: 2000});
    }finally {
      setSubmitCustomer(false);
    }
  }

  // calculations
  const savedConfig = JSON.parse(localStorage.getItem('storeConfig')) || { taxRate: 14 };
  const taxRateDecimal = applyTax ? (savedConfig.taxRate / 100) : 0;
  
  const subtotal = cart.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = item.quantity ?? 0;
    const ratio = item.unit_ratio ?? 1;

    return sum + price * qty * ratio;
  }, 0);

  const tax = subtotal * taxRateDecimal;
  const total = subtotal + tax;
  
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const paid = paidAmount === '' ? total : parseFloat(paidAmount);
    if (paid < total && !selectedCustomer) {
        toast.warning('اكمل الاجراءات', {position: 'bottom-right', autoClose: 2000});
        return;
    }
    setProcessing(true);
    try {
      const payload = {
        customer_id: selectedCustomer || null,
        payment_method: paymentMethods,
        card_reference: paymentMethods === 'card' ? cardReference : null,
        status: paid < total ? 'pending' : 'completed',
        total: subtotal,
        tax: tax,
        discount: 0,
        grand_total: total,
        paid_amount: paid,
        items: cart.map(item => ({ 
          product_id: item.id, 
          quantity: item.quantity,
          unit_price: parseFloat(item.price),
          subtotal: parseFloat(item.price) * item.quantity,
          is_pack: item.is_pack
        }))
      };
      await api.post('/orders', payload);
      setCart([]);
      setSelectCustomer('');
      setPaidAmount('');
      setCardReference('');
      setOrderStatus('completed');
      fetchData()
      toast.success('تمت عمليه الشراء بنجاح',{position: 'bottom-right', autoClose: 2000});
    } catch (error) {
      toast.error('حدث خطا' + (error.response?.data?.message || ""));
    } finally {
      setProcessing(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = activeCat === 'all' || p.category_id === activeCat;

    return matchesSearch && matchesCat;
  })

  if(loading) return <div className='loadingWrapper'><Activity className='spin' size={48} style={{color: 'var(--primary-color)'}}/></div>

  return (
    <div className={classes.pos}>

      <div className={classes.right}>
        
        <div className={classes.searchItem}>
          <input 
            type="text" 
            className='inp-primary'
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            name="searchInp" 
            id="searchInp"
            placeholder='بحث بأسم المنتج أو رمز المنتج'
          />
        </div>
        
        <div className={classes.categoires}>
            <button className={`${classes.catBtn} ${activeCat === 'all' ? classes.catBtnActive : ''}`} onClick={() => setActiveCat('all')}>الكل</button>
            {categories.map(c => (
              <button key={c.id} className={`${classes.catBtn} ${activeCat === c.id ? classes.catBtnActive : ''}`} onClick={() => setActiveCat(c.id)}>{c.name}</button>
            ))}
        </div>
        
        <div className={classes.products}>
          {filteredProducts.map(p => {
            const hasImage = !!p.image;
            const stockCount = p.stock;

            return (
              <div 
                key={p.id} 
                className={classes.product} 
                onClick={() => !p.has_multi_unit ? addToCart(p, false) : null}
              >
                {hasImage ? 
                  <img className={classes.image} src={p.image} alt={p.name} /> :
                  <div className={classes.imageAlternative}><LayoutGrid size={30} /></div>
                }
                <h2>{p.name}</h2>
                <p className={classes.sku}>{p.sku || "لا يوجد SKU"}</p>
                <p className={classes.price}>{p.price}</p>
                <span className={classes.stock}>المخزون : {p.stock}</span>
                {p.has_multi_unit && (
                  <div className={classes.actionsCell}>
                    <button 
                      className={`${classes.btnProduct} ${classes.unit}`}
                      disabled={p.stock <= 0}
                      onClick={(e) => {e.stopPropagation(); addToCart(p, false);}}
                    >
                      <Plus size={18}/> علبه({p.unit_name})
                    </button>
                    <button 
                      className={`${classes.btnProduct} ${classes.pick}`}
                      disabled={p.stock < (p.pack_qty || 1)}
                      onClick={(e) => {e.stopPropagation(); addToCart(p, true);}}
                    >
                      <Plus size={18}/> كرتونه({p.pack_name})
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {filteredProducts.length === 0 && (
            <div className={classes.emptyProducts}>
              <h4>لا توجد منتجات</h4>
            </div>
          )}
        </div>
      
      </div>

      <div className={classes.left}>

        <div className={classes.sectionTop}>
          <ShoppingCart size={22} />
          <h2>سلة الطلبات</h2>
        </div>
        
        <div className={classes.sectionSearch}>
          <User size={18} className={classes.users} />
          <select id='customerId' value={selectedCustomer} onChange={(e) => setSelectCustomer(e.target.value)}>
            <option value="">عميل عام (Walk-in)</option>
            {customers.map(c =>{ 
              return (
                <option key={c.id} value={c.id}>{c.name}</option>
              )
            })}
          </select>
          <button onClick={() => setModalOpen(true)}>
            <Plus size={20} />
          </button>
        </div>
        
        <div className={classes.sectionCart}>
            {cart.length > 0 ? 
              (
                <div className={classes.cartItems}>
                  {cart.map(item => (
                    <div key={item.cartItemId} className={classes.cartItem}>

                      <div className={classes.itemDetails}>
                        <h4>{item.name}</h4>
                        <p>${parseFloat(item.price).toFixed(2)} للوحدة</p>
                      </div>
                      
                      <div className={classes.btnControls}>
                        <button onClick={() => updateQuantity(item.cartItemId, -1)}><Minus size={14} /></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.cartItemId, 1)}><Plus size={14} /></button>
                      </div>
                    
                      <div className={classes.itemTotal}>
                        <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                      </div>

                      <button onClick={() => removeFromCart(item.cartItemId)} className={classes.delBtn}><Trash2 size={16} /></button>
                 
                    </div>
                  ))}
                </div>
              ) 
              :
              (
                <div className={classes.emptyCart}>
                  <ShoppingCart size={40} />
                  <h3>السلة فارغة، قم بإضافة منتجات</h3>
                </div>
              )
            }
        </div>
        
        <div className={classes.sectionFooter}>
          <div className={classes.totalsGroup}>
            
            <div className={classes.checkbox}>
              <label htmlFor='check'>
                <input type="checkbox" name="check" id="check" checked={applyTax} onChange={e => setApplyTax(e.target.checked)} />
                تطبيق الضريبة والمحاسبة
              </label>
            </div>
            
            <div className={classes.totalRow}>
              <span>المجموع الفرعي :</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            
            <div className={classes.totalRow}>
              <span>الضريبة : ({applyTax ? (savedConfig?.taxRate || 15) : 0}%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
          
            <div className={classes.grandTotal}>
              <span>الإجمالي المطلوب :</span>
              <span>${total.toFixed(2)}</span>
            </div>
            
          </div>

            <div className={classes.balance}>
              <label htmlFor="balance">المبلغ المدفوع (اتركه فارغاً للدفع بالكامل)</label>
              <input type="number" name="balance" id="balance" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder={`Total : ${total.toFixed(2)}`} />
              {paidAmount !== '' && parseFloat(paidAmount) > 0 && parseFloat(paidAmount) < total && (
                <p>الباقي (آجل): ${(total - parseFloat(paidAmount || 0)).toFixed(2)}</p>
              )}
            </div>

            <div className={classes.paymentMethods}>
              <button 
                className={`${classes.payBtn} ${paymentMethods === "cash" ? classes.payBtnActive : ''}`}
                onClick={() => setPaymentMethods(prev => 'cash')}
              >
                <Banknote size={18} /> نقدي (Cash)
              </button>
              <button 
                className={`${classes.payBtn} ${paymentMethods === "card" ? classes.payBtnActive : ''}`}
                onClick={() => setPaymentMethods(prev => 'card')}
              >
                <CreditCard size={18} /> بطاقة (Card)
              </button>
            </div>

            {paymentMethods === 'card' && (
              <div className={classes.payInp}>
                <label htmlFor="cardNumber">رقم المرجع (إيصال الدفع عبر ماكينة البطاقة)</label>
                <input 
                  type="text" 
                  name="cardNumber" 
                  id="cardNumber" 
                  value={cardReference} 
                  onChange={e => setCardReference(e.target.value)} 
                  placeholder='مثال : 123456789'  
                  required={paymentMethods === 'card'}
                />
              </div>
            )}

            <button 
              className={`btn-primary ${classes.submitBtn}`}
              disabled={cart.length === 0 || processing}
              onClick={handleCheckout}
            >
              {processing ? 'حاري اصدار الفاتوره' : 'اصدار الفاتورة (100.00$)'}
            </button>
        </div>

      </div>
      
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title='تسجيل عميل جديد سريع'>
          <form onSubmit={handleAddNewCustomer}>
            <div className='inpRowComp'>
              <label htmlFor="custName">اسم العميل *</label>
              <input 
                type="text" 
                required
                name="custName" 
                id="custName" 
                className='inp-primary'
                value={formDataCustomer.name}
                onChange={(e) => setFormDataCustomer({...formDataCustomer,name : e.target.value})}  
                placeholder='Full Name / الاسم'
              />
            </div>
            <div className='inpRowComp'>
              <label htmlFor="custPhone">رقم الهاتف (11 رقم) *</label>
              <input 
                type="text" 
                required
                name="custPhone" 
                id="custPhone" 
                className='inp-primary'
                value={formDataCustomer.phone}
                onChange={(e) => setFormDataCustomer({...formDataCustomer,phone : e.target.value})}  
                placeholder='ex: 01012345678'
              />
            </div>
            <div className='inpRowComp'>
              <label htmlFor="custEmail">البريد الإلكتروني (اختياري/مطلوب للفواتير الإلكترونية) *</label>
              <input 
                type="email" 
                required
                name="custEmail" 
                id="custEmail" 
                className='inp-primary'
                value={formDataCustomer.email}
                onChange={(e) => setFormDataCustomer({...formDataCustomer,email : e.target.value})}  
                placeholder='user@gmail.com'
              />
            </div>

            <button className={`btn-primary ${classes.formBtn}`} disabled={submitCustomer}>
              {submitCustomer ? 'جاري الحفظ' : 'حفظ وختيار العميل'}
            </button>
          </form>
      </Modal>

    </div>
  )
};

export default POSPage;