import { Activity, Edit, Plus, Trash, UserCog } from 'lucide-react';
import SectionsHeader from '../../components/UI/SectionsHeader';
import classes from './Users.module.css';
import TableItem from '../../components/UI/Table';
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import Modal from '../../components/UI/Modal';

export default function UsersPage() {
    const [users,setUsers] = useState([]);
    const [branches,setBranches] = useState([]);
    const [loading,setLoading] = useState(true);
    const [modalOpen,setModalOpen] = useState(false);
    const [submitting,setSubmitting] = useState(false);
    const [formData, setFormData] = useState({id: null, name: '', email: '', password: '', rols: 'cashier', branch_id: ''})
    const [inpType,setInpType] = useState('password');

    async function fetchData() {
        try {
            const [branRes,usersRes] = await Promise.all([
                api.get('branches'),
                api.get('users')
            ]);
            setBranches(branRes.data);
            setUsers(usersRes.data);
        }catch(error) {
            console.log(error);
        }finally{ 
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    },[]);

    function handleOpenModal(user) {
        if(user) {
            setFormData({...user,password: ''});       
        }else {
            setFormData({ id: null, name: '', email: '', password: '', role: 'cashier', branch_id: '' });
        }
        setModalOpen(true);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            if(formData.id) {
                await api.put(`/users/${formData.id}`, formData);
                toast.success('تم التعديل بنجاح', {position: 'bottom-right', autoClose: 2000})
            }else {
                await api.post('/users', formData);
                toast.success('تمت الاضافة بنجاح', {position: 'bottom-right', autoClose: 2000})
            }
            setModalOpen(false);
            fetchData();
        }catch(error) {
            toast.error('حدث خطأ', {position: 'bottom-right', autoClose: 2000})
        }finally {
            setSubmitting(false);
        }
    };

    async function handleDelete(id) {
        if(window.confirm("هل تريد حذف الموظف")) {
            try {
                await api.delete(`/users/${id}`);
                fetchData();
                toast.success('تم الحذف بنجاح',{position: 'bottom-right', autoClose: 2000})
            }catch(error) {
                toast.error('خطأ في الحذف',{position: 'bottom-right', autoClose: 2000})
            }
        }
    }

    if (loading) return <div className="loadingWrapper"><Activity className="spin" size={48} color="var(--primary-color)" /></div>;


    return(
        <div className={classes.users}>
            <SectionsHeader title='إدارة الموظفين والصلاحيات' description='إضافة الكاشير والمديرين وتوزيع الفروع'>
                <button className='btn-primary' onClick={() => handleOpenModal()}><Plus size={18}/> أضافة مستخدم</button>
            </SectionsHeader>
            <TableItem>
                <thead>
                    <tr>
                        <th>المعرف</th>
                        <th>الاسم</th>
                        <th>البريد الإلكتروني</th>
                        <th>الرتبة / الصلاحية</th>
                        <th>الفرع</th>
                        <th>الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => {
                        return (
                            <tr key={u.id}>
                                <td>{u.id}</td>
                                <td>
                                    <div className={classes.userName}>
                                        <UserCog size={18} />
                                        <span>{u.name}</span>
                                    </div>
                                </td>
                                <td>{u.email}</td>
                                <td>
                                    {u.role === 'admin' && 'Admin'}
                                    {u.role === 'general_accountant' && 'General Accountant'}
                                    {u.role === 'branch_manager' && 'Branch Manager'}
                                    {u.role === 'branch_accountant' && 'Branch Accountant'}
                                    {u.role === 'cashier' && 'Cashier'}
                                </td>
                                <td>{u.branch?.name || "الفرع الرئيسي"}</td>
                                <td>
                                    <div className='actionsCell'>
                                        <button className={`btn edit`} onClick={() => handleOpenModal(u)}><Edit size={20} /></button>
                                        <button className={`btn delete`} onClick={() => handleDelete(u.id)}><Trash size={20}/></button>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </TableItem>
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title='إضافة مستخدم'>
                <form onSubmit={handleSubmit}>
                    <div className='inpRowComp'>
                        <label htmlFor="UserName">الاسم *</label>
                        <input required type="text" className='inp-primary' value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} name="UserName" id="UserName" />
                    </div>
                    <div className='inpRowComp'>
                        <label htmlFor="Useremail">البريد الإلكتروني *</label>
                        <input required type="email" className='inp-primary' value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} name="Useremail" id="Useremail" />
                    </div>
                    <div className='inpRowComp'>
                        <label htmlFor="UserPassword">كلمة المرور *</label>
                        <input required type={inpType || 'password'} className='inp-primary' value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} name="UserPassword" id="UserPassword" />
                    </div>
                    <div className='formGroupInp'>
                        <div>
                            <label htmlFor="userRole">الرتبة / الصلاحية</label>
                            <select className='inp-primary' required value={formData.rols} onChange={(e) => setFormData({...formData,rols: e.target.value})} name="userRole" id="userRole">
                                <option value="admin">Super Admin</option>
                                <option value="general_accountant">General Accountant</option>
                                <option value="branch_manager">Branch Manager</option>
                                <option value="branch_accountant">Branch Accountant</option>
                                <option value="cashier">Cashier</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="barnches">الفرع</label>
                            <select className='inp-primary' required value={formData.branch_id} onChange={(e) => setFormData({...formData,branch_id: e.target.value})} name="barnches" id="barnches">
                                <option value="">-- Main HQ --</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button className={`btn-primary ${classes.btn}`} disabled={submitting}>
                        {submitting ? 'جاري الحفظ' : 'حفظ'}
                    </button>
                </form>
            </Modal>
        </div>
    )
}