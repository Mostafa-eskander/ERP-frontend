import { useEffect, useState } from 'react';
import { Edit, Plus, Trash, Activity } from 'lucide-react';
import { toast } from 'react-toastify';

import classes from './Categories.module.css';
import SectionsHeader from '../../components/UI/SectionsHeader';
import TableItem from '../../components/UI/Table';
import Modal from '../../components/UI/Modal';
import api from '../../api/axios';

export default function Categories () {
    const [categories,setCategories] = useState([]);
    const [loading,setLoading] = useState(true);
    const [modalOpen,setModalOpen] = useState(false);
    const [formData,setFormData] = useState({ id: null, parent_id: '', name: '', description: '', image: '' });
    const [submitting,setSubmitting] = useState(false);

    async function fetchData() {
        try {
            const {data} = await api.get('/categories');
            setCategories(data);
        }catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
       fetchData(); 
    },[]);

    const handleOpenModal = (category = null) => {
        if (category) {
            setFormData({...category, parent_id: category.parent_id || ''});
        } else {
            setFormData({ id: null, parent_id: '', name: '', description: '', image: '' });
        }
        setModalOpen(true);
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
        try{
            if(formData.id) {
                await api.put(`/categories/${formData.id}`, formData);
            }else {
                await api.post('/categories', formData);
            }
            setModalOpen(false);
            fetchData();
            toast.success('تم الحفظ بنجاح',{position:'bottom-right',autoClose: 2000});
        }catch(error) {
            console.log(error); // ← ضيف السطر ده
            toast.error(error?.response?.data?.message || 'حدث خطأ',{position: 'bottom-right',autoClose: 2000});
        }finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id) {
        if(window.confirm('هل تريد حذف القسم ؟')) {
            try{
                await api.delete(`/categories/${id}`);
                toast.success("تم الحذف بنجاح",{position: 'bottom-right',autoClose: 2000});
                fetchData();
            }catch(error) {
                toast.error("يوجد خطأ",{position: 'bottom-right',autoClose: 2000});
            }
        }
    }

    if (loading) return <div className="loadingWrapper"><Activity className="spin" size={48} color="var(--primary-color)" /></div>;

    return (
        <div className={classes.categories}>
            <SectionsHeader 
                title="إدارة الأقسام" 
                description="أضف وعدّل فئات منتجاتك بكل سهولة" 
            >
            <button className='btn-primary' onClick={() => handleOpenModal()}><Plus /> اضافة قسم</button>
            </SectionsHeader>
            <TableItem emptyMessage={categories.length === 0 ? 'لا توجد اقسام قم بالإضافة' : ''}>
                <thead>
                    <tr>
                        <th>المعرف</th>
                        <th>الصورة</th>
                        <th>اسم القسم</th>
                        <th>يتبع لقسم (رئيسي)</th>
                        <th>الوصف</th>
                        <th>الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map((category) => {
                        const parent = categories.find(cate => cate.id === category.parent_id);

                        return (
                            <tr key={category.id}>
                                <td>{category.id}</td>
                                <td>
                                        {category.image ? (
                                            <img src={category.image} alt={category.name} className='image' />
                                        ) : (
                                            <div className={`imageIcon ` + `image`}>-</div>
                                        )}
                                </td>
                                <td>{category.name}</td>
                                <td>{parent ? <span style={{color: 'var(--primary-color)'}}>{parent.name}</span> : <span style={{color: 'var(--text-secondary)'}}>قسم رئيسي</span>}</td>
                                
                                <td className={classes.des}>{category.description || '-'}</td>
                                <td>
                                    <div className='actionsCell'>
                                        <button className={`btn ` + `edit`} title='تعديل' onClick={() => handleOpenModal(category)}><Edit size={18} /></button>
                                        <button className={`btn ` + `delete`} title='حذف' onClick={() => handleDelete(category.id)}><Trash size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </TableItem>
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="إضافة قسم جديد">
                    <form onSubmit={handleSubmit}>
                        <div className='formGroup'>
                            <label htmlFor="categoryN">يندرج تحت قسم (القسم الرئيسي)</label>
                            <select className='inp-primary' id='categoryN' name='categoryN' value={formData.parent_id || ''} onChange={(e) => setFormData({...formData,parent_id: e.target.value ? Number(e.target.value) : ''})}>
                                <option value="">-- هذا قسم رئيسي بحد ذاته</option>
                                {categories.filter(c => c.id !== formData.id && !c.parent_id).map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className='inpRowComp'>
                                <label htmlFor='cateName'>اسم القسم *</label>
                                <input className='inp-primary' type="text" required name="cateName" id="cateName" value={formData.name || ''} onChange={(e) => setFormData({...formData,name: e.target.value})} />
                        </div>
                        <div className='inpRowComp'>
                            <label htmlFor='cateDescrition'>وصف القسم (اختياري)</label>
                            <textarea className='inp-primary' name="cateDescription" id="cateDescription" value={formData.description || ''} onChange={(e) => setFormData({...formData,description: e.target.value})} />
                        </div>
                        <div className='inpRowComp'>
                            <label htmlFor="cateImage">صورة القسم (اختياري)</label>
                            <input className='inp-primary' type="file" accept='image/*' name="cateImage" id="cateImage" onChange={handleImageChange} />
                            {formData.image && <img src={formData.image} alt="preview" style={{width: '60px', height: '60px', marginTop: '10px', borderRadius: '8px', objectFit: 'cover'}} />}
                        </div>
                        <button type='submit' className={`btn-primary ` + `btnForm`} disabled={submitting}>
                            {submitting ? "جاري الحفظ" : 'حفظ البيانات' }
                        </button>
                    </form>
            </Modal>
        </div>
    )
}