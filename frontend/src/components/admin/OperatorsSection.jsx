import { useEffect, useState } from 'react';
import { createOperator, deleteOperator, getOperators, updateOperator } from '../../api/client';
import {
	AdminSection,
	Badge,
	Button,
	DataTable,
	EmptyState,
	ErrorState,
	FormActions,
	Input,
	LoadingState,
	MobileCard,
	Modal,
	SaveMessage,
	Stack,
} from './AdminUI';

const EMPTY_FORM = {
	name: '',
	employeeId: '',
	department: '',
};

export default function OperatorsSection() {
	const [operators, setOperators] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [search, setSearch] = useState('');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editData, setEditData] = useState(null);
	const [form, setForm] = useState(EMPTY_FORM);
	const [message, setMessage] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const keyword = search.trim().toLowerCase();
	const filteredOperators = operators.filter((operator) => {
		if (!keyword) {
			return true;
		}

		return [operator.name, operator.employee_id, operator.department]
			.filter(Boolean)
			.some((value) => String(value).toLowerCase().includes(keyword));
	});

	const loadOperators = async () => {
		try {
			setError('');
			setLoading(true);
			const data = await getOperators();
			setOperators(data);
		} catch (err) {
			setError(err.message || 'โหลดข้อมูลพนักงานไม่สำเร็จ');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadOperators();
	}, []);

	const resetForm = () => {
		setEditData(null);
		setForm(EMPTY_FORM);
		setMessage('');
	};

	const openCreateModal = () => {
		resetForm();
		setIsModalOpen(true);
	};

	const openEditModal = (operator) => {
		setEditData(operator);
		setForm({
			name: operator.name || '',
			employeeId: operator.employee_id || '',
			department: operator.department || '',
		});
		setMessage('');
		setIsModalOpen(true);
	};

	const closeModal = () => {
		setIsModalOpen(false);
		resetForm();
	};

	const handleChange = (field) => (event) => {
		setForm((current) => ({ ...current, [field]: event.target.value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setSubmitting(true);
		setMessage('');

		const payload = {
			name: form.name,
			employee_id: form.employeeId || null,
			department: form.department || null,
		};

		try {
			if (editData) {
				await updateOperator(editData.id, payload);
				setMessage('อัปเดตสำเร็จ');
			} else {
				await createOperator(payload);
				setMessage('เพิ่มสำเร็จ');
			}

			await loadOperators();
			window.setTimeout(() => {
				closeModal();
			}, 700);
		} catch (err) {
			setMessage(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
		} finally {
			setSubmitting(false);
		}
	};

	const handleToggleStatus = async (operator) => {
		try {
			await updateOperator(operator.id, { is_active: !operator.is_active });
			await loadOperators();
		} catch (err) {
			setError(err.message || 'เปลี่ยนสถานะไม่สำเร็จ');
		}
	};

	const handleDelete = async (operatorId) => {
		if (!window.confirm('ยืนยันการลบผู้ปฏิบัติงาน?')) {
			return;
		}

		try {
			await deleteOperator(operatorId);
			closeModal();
			await loadOperators();
		} catch (err) {
			setError(err.message || 'ลบข้อมูลไม่สำเร็จ');
		}
	};

	return (
		<AdminSection
			action={
				<div className="flex w-full items-center gap-3">
					<div className="min-w-0 flex-1">
						<Input
							placeholder="ค้นหาชื่อ รหัส หรือแผนก"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
						/>
					</div>
					<Button className="shrink-0 whitespace-nowrap" onClick={openCreateModal}>
						+ เพิ่ม
					</Button>
				</div>
			}
		>
			{loading ? <LoadingState message="กำลังโหลดข้อมูลพนักงาน..." /> : null}
			{!loading && error ? <ErrorState message={error} onRetry={loadOperators} /> : null}
			{!loading && !error && filteredOperators.length === 0 ? (
				<EmptyState
					title={operators.length === 0 ? 'ยังไม่มีข้อมูลพนักงาน' : 'ไม่พบพนักงานที่ค้นหา'}
					description={
						operators.length === 0
							? 'เริ่มต้นด้วยการสร้างรายชื่อพนักงานเพื่อใช้ในสายการผลิต'
							: 'ลองเปลี่ยนคำค้น หรือเพิ่มพนักงานใหม่'
					}
					action={operators.length === 0 ? <Button onClick={openCreateModal}>เพิ่มพนักงานคนแรก</Button> : null}
				/>
			) : null}

			{!loading && !error && filteredOperators.length > 0 ? (
				<>
					<Stack className="md:hidden">
						{filteredOperators.map((operator) => (
							<MobileCard key={operator.id}>
								<div className="flex items-start justify-between gap-3">
									<div className="space-y-1">
										<h3 className="text-base font-bold text-slate-900">{operator.name}</h3>
										<p className="text-sm text-slate-500">
											{operator.employee_id || 'ไม่มีรหัสพนักงาน'}
											{' • '}
											{operator.department || 'ไม่ระบุแผนก'}
										</p>
									</div>
									<button type="button" onClick={() => handleToggleStatus(operator)}>
										<Badge color={operator.is_active ? 'green' : 'gray'}>
											{operator.is_active ? 'ใช้งาน' : 'ระงับ'}
										</Badge>
									</button>
								</div>
								<div className="mt-4">
									<FormActions>
									<Button size="compact" variant="secondary" className="flex-1" onClick={() => openEditModal(operator)}>
										แก้ไข
									</Button>
									</FormActions>
								</div>
							</MobileCard>
						))}
					</Stack>

					<DataTable
						columns={[
							{ key: 'name', label: 'ชื่อพนักงาน' },
							{ key: 'meta', label: 'รหัส / แผนก' },
							{ key: 'status', label: 'สถานะ' },
							{ key: 'actions', label: 'จัดการ', className: 'text-right' },
						]}
					>
						{filteredOperators.map((operator) => (
							<tr key={operator.id} className="hover:bg-slate-50/80">
								<td className="px-5 py-4 font-semibold text-slate-900">{operator.name}</td>
								<td className="px-5 py-4">
									<div className="font-mono text-xs text-slate-600">{operator.employee_id || '—'}</div>
									<div className="mt-1 text-xs text-slate-500">{operator.department || '—'}</div>
								</td>
								<td className="px-5 py-4">
									<button type="button" onClick={() => handleToggleStatus(operator)}>
										<Badge color={operator.is_active ? 'green' : 'gray'}>
											{operator.is_active ? 'ใช้งาน' : 'ระงับ'}
										</Badge>
									</button>
								</td>
								<td className="px-5 py-4">
									<div className="flex justify-end gap-2">
										<Button variant="text" onClick={() => openEditModal(operator)}>
											แก้ไข
										</Button>
									</div>
								</td>
							</tr>
						))}
					</DataTable>
				</>
			) : null}

			<Modal
				title={editData ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงาน'}
				description="กรอกข้อมูลพื้นฐานของพนักงานเพื่อใช้ในระบบการผลิต"
				isOpen={isModalOpen}
				onClose={closeModal}
			>
				<form className="space-y-4" onSubmit={handleSubmit}>
					<Input label="ชื่อ-นามสกุล *" value={form.name} onChange={handleChange('name')} required />
					<Input label="รหัสพนักงาน" value={form.employeeId} onChange={handleChange('employeeId')} />
					<Input label="แผนก / สายการผลิต" value={form.department} onChange={handleChange('department')} />
					<FormActions>
						<Button type="submit" className="flex-1" disabled={submitting}>
							{submitting ? 'กำลังบันทึก...' : editData ? 'บันทึกข้อมูล' : 'เพิ่มรายชื่อ'}
						</Button>
						{editData ? (
							<Button type="button" variant="danger" className="flex-1" onClick={() => handleDelete(editData.id)}>
								ลบข้อมูล
							</Button>
						) : null}
						<Button type="button" variant="secondary" className="flex-1" onClick={closeModal}>
							ยกเลิก
						</Button>
					</FormActions>
					<SaveMessage message={message} />
				</form>
			</Modal>
		</AdminSection>
	);
}
