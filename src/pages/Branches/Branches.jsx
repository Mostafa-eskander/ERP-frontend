import { Activity, Edit, Plus, Store, Trash } from 'lucide-react';
import SectionsHeader from '../../components/UI/SectionsHeader';
import classes from './Branches.module.css';
import TableItem from '../../components/UI/Table';
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import Modal from '../../components/UI/Modal';

export default function BranchesPage() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ id: null, name: '', location: '', phone: '', is_active: true });
    const [submitting, setSubmitting] = useState(false);

    async function fetchData() {
        try {
            const {data} = await api.get('/branches');
            setBranches(data);
        }catch(error) {
            console.log(error)
        }finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    },[]);

    function handleOpenModal(branch) {
        if(branch) {
            setFormData(branch);
        }else {
            setFormData({ id: null, name: '', location: '', phone: '', is_active: true })
        }
        setModalOpen(true);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (formData.id) {
                await api.put(`/branches/${formData.id}`, formData);
                toast.success('تم التعديل بنجاح',{position: 'bottom-right', autoClose: 2000})
            } else {
                await api.post('/branches', formData);
                toast.success('تمت الاضافة بنجاح',{position: 'bottom-right', autoClose: 2000})
            }
            setModalOpen(false);
            fetchData();
        }catch(error) {
            toast.error('حدث خطأ',{position: 'bottom-right', autoClose: 2000})
        }finally {
            setSubmitting(false);
        }
    };

    async function handleDelete(id) {
        if(window.confirm("هل تريد الحذف ؟")) {
            try {
                await api.delete(`branches/${id}`);
                fetchData();
                toast.success('تم الحذف بنجاح',{position: 'bottom-right', autoClose: 2000})
            }catch(error) {
                toast.error('فشل عملية الحذف ',{position: 'bottom-right', autoClose: 2000})
            }
        }
    } 

    if(loading) return <div className='loadingWrapper'><Activity className='spin' size={48} style={{color: 'var(--primary-color)'}}/></div>
    return (
        <div className={classes.branches}>
            <SectionsHeader title='إدارة الفروع' description='تتبع الفروع وموقعها في النظام'>
                <button className='btn-primary' onClick={() => handleOpenModal()}><Plus size={18} /> أضافه فرع</button>
            </SectionsHeader>
            <TableItem>
                <thead>
                    <tr>
                        <th>المعرف</th>
                        <th>اسم الفرع</th>
                        <th>الموقع الجغرافي</th>
                        <th>رقم الهاتف</th>
                        <th>الموظفين</th>
                        <th>الحالة</th>
                        <th>الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    {branches.map((b) => {
                        console.log(b)
                        return (
                            <tr key={b.id}>
                                <td>{b.id}</td>
                                <td>
                                    <div className={classes.branchName}>
                                        <Store size={20} />
                                        <span>{b.name}</span>
                                    </div>
                                </td>
                                <td>{b.location || '-'}</td>
                                <td>{b.phone || '-'}</td>
                                <td>{b.users_count || 0}</td>
                                <td style={{color: `${b.is_active ? 'var(--secondary-color)' : 'var(--danger-color)' }`}}>{b.is_active ? 'نشط' : 'غير نشط'}</td>
                                <td>
                                    <div className='actionsCell'>
                                        <button className={`btn edit`} onClick={() => handleOpenModal(b)}><Edit size={20}/></button>
                                        <button className={`btn delete`} onClick={() => handleDelete(b.id)}><Trash size={20}/></button>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </TableItem>
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title='إضافة فرع'>
                <form onSubmit={handleSubmit}>
                    <div className="inpRowComp">
                        <label htmlFor="branchName">اسم الفرع *</label>
                        <input className='inp-primary' type="text" required value={formData.name} onChange={(e) => setFormData({...formData,name: e.target.value})} name="branchName" id="branchName" />
                    </div>
                    <div className="inpRowComp">
                        <label htmlFor="branchLocation">الموقع الجغرافي</label>
                        <input className='inp-primary' type="text" required value={formData.location} onChange={(e) => setFormData({...formData,location: e.target.value})} name="branchLocation" id="branchLocation" />
                    </div>
                    <div className="inpRowComp">
                        <label htmlFor="branchPhone">رقم الهاتف</label>
                        <input className='inp-primary' type="text" required value={formData.phone} onChange={(e) => setFormData({...formData,phone: e.target.value})} name="branchPhone" id="branchPhone" />
                    </div>
                    <div className="inpRowComp">
                        <label htmlFor="branchStatu">اسم الفرع *</label>
                        <select className='inp-primary' required value={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})} id='branchStatu' name='branchStatu'>
                            <option value="true">نشط</option>
                            <option value="false">غير نشط</option>
                        </select>
                    </div>
                    <button className={`btn-primary ${classes.btn}`} disabled={submitting}>
                        {submitting ? 'جاري الحفظ' : 'حفظ'}
                    </button>
                </form>
            </Modal>
        </div>
    )
}