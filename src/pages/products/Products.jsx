import { Activity, Edit, Package, Plus, Trash } from 'lucide-react';

import classes from './Products.module.css';
import SectionsHeader from '../../components/UI/SectionsHeader';
import SearchItem from '../../components/UI/SearchItem';
import TableItem from '../../components/UI/Table';

import { useEffect, useState } from 'react';
import Modal from '../../components/UI/Modal';
import api from '../../api/axios';
import { toast } from 'react-toastify';

export default function ProductsPage() {
    const [loading,setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isModalEditMode, setIsModalEditMode] = useState(false);
    const [products,setProducts ]= useState([]);
    const [categories,setCategories] = useState([]);
    const [branches,setBranches] = useState([]);
    const [suppliers,setSuppliers] = useState([]);
    const [modalOpen,setModalOpen] = useState(false);
    const [search,setSearch] = useState('');
    const [printData, setPrintData] = useState(null);


    const [formData, setFormData] = useState({
        id: null, category_id: '', supplier_id: '', branch_id: '', name: '', sku: '', barcode: '', price: '', cost: '', stock: '0', addedStock: '', image: '',
        has_multi_unit: false, unit_name: 'قطعة', pack_name: 'كرتونة', pack_qty: '', pack_price: '', pack_barcode: ''
    });

    async function fetchData() {
        try {
            const [prodsRes, catsRes, branchesRes, suppRes] = await Promise.all([
                api.get('/products'),
                api.get('/categories'),
                api.get('/branches'),
                api.get('/suppliers')
            ]);
            
            setProducts(prodsRes.data);
            setCategories(catsRes.data);
            setBranches(branchesRes.data || []);
            setSuppliers(suppRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    function handleOpenModal(prod = null) {
        if(prod) {
            setFormData({
                id: prod.id || null,
                category_id: prod.category_id || '',
                supplier_id: prod.supplier_id || '',
                branch_id: prod.branch_id || '',
                name: prod.name || '',
                sku: prod.sku || '',
                barcode: prod.barcode || '',
                price: prod.price || '',
                cost: prod.cost || '',
                stock: prod.stock ?? 0,
                addedStock: '',
                image: prod.image || '',
                has_multi_unit: prod.has_multi_unit ?? false,
                unit_name: prod.unit_name || 'قطعة',
                pack_name: prod.pack_name || 'كرتونة',
                pack_qty: prod.pack_qty || '',
                pack_price: prod.pack_price || '',
                pack_barcode: prod.pack_barcode || ''
                });
                setIsModalEditMode(true);
        }else {
            setFormData({id: null, category_id: '', supplier_id: '', branch_id: '', name: '', sku: '', barcode: '', price: '', cost: '', stock: '0', addedStock: '', image: '',
                has_multi_unit: false, unit_name: 'قطعة', pack_name: 'كرتونة', pack_qty: '', pack_price: '', pack_barcode: ''
            });
            setIsModalEditMode(false);
        };
        setModalOpen(true)
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({ ...formData, image: reader.result });
        };
        reader.readAsDataURL(file);
        }
    };

    
    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            let finalData = {...formData};
            let savedProduct;

            if (isModalEditMode && finalData.id && finalData.addedStock) {
                finalData.stock = parseInt(finalData.stock || 0) + parseInt(finalData.addedStock || 0);
            }

            if(finalData.id) {
                const res = await api.put(`/products/${finalData.id}`,finalData);
                savedProduct = res.data;
                toast.success('تم التعديل بنجاح',{position: 'bottom-right',autoClose: 2000});
            }else {
                const res = await api.post('/products', finalData);
                savedProduct = res.data;
                toast.success('تم الاضافة بنجاح',{position: 'bottom-right',autoClose: 2000});
            }

            setModalOpen(false);

            const qtyToPrint = !isModalEditMode && finalData.addedStock ? parseInt(finalData.addedStock) : parseInt(savedProduct.stock);
            if(qtyToPrint > 0) {
                setPrintData({product: savedProduct, quantity: qtyToPrint})
            }
            
            fetchData();
        } catch(error) {
            toast.error('يوجد خطأ',{position: 'bottom-right',autoClose: 4000})
        }finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id) {
        if (window.confirm('هل تريد حذف المنتج')) {
        try {
            await api.delete(`/products/${id}`);
            toast.success('تم الحذف بنجاح',{position: 'bottom-right',autoClose: 2000});
            fetchData();
        } catch (err) { alert(t('save_error')); }
        }
        fetch();
    }

    const filterProducts = products.filter((product) =>
        (product.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (product.sku || '').toLowerCase().includes(search.toLowerCase())
    );
    
    if (loading) return <div className="loadingWrapper"><Activity className="spin" size={48} color="var(--primary-color)" /></div>;

    return (
        <div className={classes.producs}>
            <SectionsHeader 
                title="إدارة المنتجات" 
                description='أضف بضائعك، تتبع الكميات ولون مخزونك.'
            >
                <button onClick={handleOpenModal} className='btn-primary'><Plus /> إضافه منتج جديد</button>
            </SectionsHeader>

            <SearchItem >
                <input onChange={(e) => setSearch(e.target.value)} type="text" className="inp-primary" name="inpSearch" id="inpSearch" placeholder="البحث بالاسم أو رمز SKU" />
            </SearchItem>
            
            <TableItem emptyMessage={filterProducts.length === 0 ? 'لا يوجد منتجات قم بالإضافة' : ''}>
                <thead>
                        <tr>
                            <th className={classes.code}>رمز (SKU/Barcode)</th>
                            <th>الصورة</th>
                            <th>اسم المنتج</th>
                            <th>القسم</th>
                            <th>السعر ($)</th>
                            <th>التكلفة ($)</th>
                            <th>المخزون</th>
                            <th>الإجراءات</th>
                        </tr>
                </thead>
                <tbody>
                    {filterProducts.map((product) =>{ 
                            const inv = Number(product.stock) < 10;
                            const hasImage = !!product.image;
                            return(
                                <tr key={product.name}>
                                    <td><span className={classes.badge}>{product.sku}</span></td>
                                    <td>
                                        {hasImage ? (
                                            <img src={product.image} alt={product.name} className="image" />
                                        ) : (
                                            <div className={`imageIcon ` + `image`}></div>    
                                        )
                                        }
                                    </td>
                                    <td>
                                        <div className={classes.productName}>
                                            <Package size={18} />
                                            <strong>{product.name}</strong>
                                        </div>
                                    </td>
                                    <td>{product.category?.name || 'No Category' }</td>
                                    <td className={classes.price}>{Number(product.price).toLocaleString()}</td>
                                    <td className={classes.cost}>{product.cost}</td>
                                    <td className={classes.inventory}>
                                        <span className={inv ? classes.invDanger : classes.inv}>{product.stock}</span>
                                    </td>
                                    <td>
                                        <div className='actionsCell'>
                                            <button className={`btn ` + `edit`} title='تعديل' onClick={() => handleOpenModal(product)}><Edit size={18} /></button>
                                            <button className={`btn ` + `delete`} title='حذف' onClick={() => handleDelete(product.id)}><Trash size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )
                    })}
                </tbody>
            </TableItem>

            <Modal title='إضافة منتج جديد' isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                    <form className={classes.formLayout} onSubmit={handleSubmit}>
                        <div className="formGroup">
                            <label htmlFor="selectForm">أو اختر منتج مسجل مسبقاً لزيادة رصيده في الفرع المختار:</label>
                            <select 
                                value={formData.id || 'new'}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if(val === 'new') {
                                        setFormData({ 
                                            id: null, category_id: '', supplier_id: '', branch_id: '', 
                                            name: '', sku: '', barcode: '', price: '', cost: '', 
                                            stock: '0', addedStock: '', image: '',
                                            has_multi_unit: false, unit_name: 'قطعة', 
                                            pack_name: 'كرتونة', pack_qty: '', pack_price: '', pack_barcode: ''
                                        });
                                        setIsModalEditMode(false); // ← إضافة جديدة
                                    } else {
                                        const existing = products.find(p => p.id == val);
                                        if(existing) {
                                            setFormData({...existing, branch_id: '', stock: existing.stock || 0, addedStock: ''});
                                            setIsModalEditMode(true); // ← ضروري عشان يظهر حقل الإضافة ويشتغل الشرط
                                        }
                                    }
                                }}
                                name="selectForm" 
                                id="selectForm" 
                                className='inp-primary'
                            >
                                <option value="new">-- منتج جديد تماماً --</option>
                                {products.map((product) => (
                                    <option key={product.id} value={product.id}>{product.name} ({product.sku || 'لا يوجد'})</option>
                                ))}
                            </select>
                        </div>
                        <div className="inpRowComp">
                            <label htmlFor="prodName">اسم المنتج *</label>
                            <input className='inp-primary' type="text" name="prodName" id="prodName" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="formGroupInp">
                            <div className='inpRow'>
                                <label>القسم (رئيسي أو فرعي) *</label>
                                <select className='inp-primary' required value={formData.category_id || ''} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                                    <option value="">-- اختر القسم --</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='inpRow'>
                                <label>المورد / الماركة (Brand)</label>
                                <select className='inp-primary' value={formData.supplier_id || ''} onChange={e => setFormData({...formData, supplier_id: e.target.value})}>
                                    <option value="">-- بدون تحديد --</option>
                                    {suppliers.map((supp) => (
                                        <option key={supp.id} value={supp.id}>{supp.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="formGroupInp">
                            <div className='inpRow'>
                                <label htmlFor='inpPrice'>سعر البيع (للعميل) *</label>
                                <input className='inp-primary' type="number" name="inpPrice" id="inpPrice" step="0.01" required value={formData.price || ''} onChange={e => setFormData({...formData, price: e.target.value})} />
                            </div>
                            <div className='inpRow'>
                                <label htmlFor='inpCost'>سعر التكلفة (للشراء) *</label>
                                <input className='inp-primary' type="number" name="inpCost" id="inpCost" step="0.01" required value={formData.cost || ''} onChange={e => setFormData({...formData, cost: e.target.value})} />
                            </div>
                        </div>
                        <div className="formGroupInp">
                            <div className='inpRow'>
                                <label htmlFor='inpStock'>المخزون</label>
                                <input className='inp-primary' type="number" name="inpStock" id="inpStock" value={formData.stock || ''} onChange={e => setFormData({...formData, stock: e.target.value})} />
                            </div>
                            <div className='inpRow'>
                                <label htmlFor='inpBrunch'>تعيين للفرع *</label>
                                <select className='inp-primary' name="inpBtunch" id="inpBtunch"  value={formData.branch_id || ''} onChange={e => setFormData({...formData, branch_id: e.target.value})}>
                                    <option value="">-- اختر الفرع --</option>
                                    {branches.map((bran) => (
                                        <option key={bran.id} value={bran.id}>{bran.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="formGroupInp">
                            <div className="inpRow">
                                <label htmlFor='inpSku'>SKU</label>
                                <input className='inp-primary' type="text" name="inpSku" id="inpSku" value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} />
                            </div>
                            {formData.id && isModalEditMode &&  (
                                <div className={`inpRow ` + `inpAdd`}>
                                    <label htmlFor='addStock'>القميه المضافه</label>
                                    <input className='inp-primary' type="number" name="addStock" id='addStock' placeholder="+" value={formData.addedStock || ''} onChange={e => setFormData({...formData, addedStock: e.target.value})} />
                                </div>
                            )}
                        </div>
                        <div className={classes.checkProduct}>
                            <label htmlFor='checkBox' className="label">
                                <input type='checkbox' id='checkBox' name='checkBox' checked={!!formData.has_multi_unit} onChange={e => setFormData({...formData, has_multi_unit: e.target.checked})} />
                                هل يُباع هذا المنتج بوحدات تعبئة كبرى؟ (مثل كرتونة، دستة)
                            </label>

                            {formData.has_multi_unit && (
                                <div className={classes.formContainer}>
                                    <div className="formGroupInp">
                                        <div>
                                            <label htmlFor='inpPiece'>اسم الوحدة الصغرى</label>
                                            <input className='inp-primary' type='text' id='inpPiece' name='inpPiece' value={formData.unit_name || ''} onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}/>
                                        </div>
                                        <div>
                                            <label htmlFor='inpLonliness'>اسم وحدة التعبئة الكبرى</label>
                                            <input className='inp-primary' type="text" name="inpLonliness" id="inpLonliness" />
                                        </div>
                                    </div>
                                    <div className="formGroupInp">
                                        <div>
                                            <label htmlFor='inpConut'>العبوة الكبرى تحتوي على كم وحدة صغرى؟</label>
                                            <input className='inp-primary' type="number" step="1" name="inpConut" id="inpConut" value={formData.pack_qty || ''} onChange={e => setFormData({...formData, pack_qty: e.target.value})} />
                                        </div>
                                        <div>
                                            <label htmlFor='inpSelling'>سعر بيع العبوة الواحدة الكبرى للعميل</label>
                                            <input className='inp-primary' type="number" step="0.01" name="inpSelling" id="inpSelling" value={formData.pack_price || ''} onChange={e => setFormData({...formData, pack_price: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="inpRowComp">
                                        <label htmlFor='parcode'>باركود العبوة الكبرى (لكي يتعرف عليه الكاشير عند بيع كرتونة كاملة)</label>
                                        <input className='inp-primary' type='text' id='parcode' name='parcode' value={formData.pack_barcode || ''} onChange={e => setFormData({...formData, pack_barcode: e.target.value})} />
                                    </div>
                                </div>
                            )}

                        </div>
                        <div className="inpImage">
                            <label htmlFor='inpImage'>صورة المنتج (اختياري)</label>
                            <input type='file' accept='image/*' onChange={handleImageChange} name="inpImage" id="inpImage" />
                            {formData.image && <img src={formData.image} alt="preview" style={{width: '60px', height: '60px', marginTop: '10px', borderRadius: '8px', objectFit: 'cover'}} />}
                        </div>
                        <button className={'btn-primary ' + `btnForm`} disabled={submitting}>
                            {submitting ? "جاري الحفظ" : 'حفظ البيانات' }
                        </button>
                    </form>
            </Modal>
        </div>
    )
}