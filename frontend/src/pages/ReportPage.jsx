import { useEffect, useState } from 'react';
import { getLines, getLogs, getLogsSummary, getProcesses } from '../api/client';
import {
	AdminSection,
	Badge,
	EmptyState,
	ErrorState,
	LoadingState,
	MobileCard,
	SearchInput,
	Stack,
	joinClasses,
} from '../components/admin/AdminUI';

const STATUS_LABELS = {
	pending: 'รอดำเนินการ',
	in_progress: 'กำลังดำเนินการ',
	completed: 'เสร็จสิ้น',
	on_hold: 'หยุดพัก / รอแก้ไข',
};

const ACTION_LABELS = {
	start: 'เริ่มงาน',
	finish: 'เสร็จสิ้น (OK)',
	ng: 'ของเสีย (NG)',
};

const STATUS_BADGE_COLORS = {
	pending: 'gray',
	in_progress: 'amber',
	completed: 'green',
	on_hold: 'red',
};

const ACTION_BADGE_COLORS = {
	start: 'blue',
	finish: 'green',
	ng: 'red',
};

const TABS = [
	{
		id: 'trays',
		label: 'งาน',
		shortLabel: 'งาน',
		tone: 'amber',
		icon: (
			<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
			</svg>
		),
	},
	{
		id: 'processes',
		label: 'สายการผลิต',
		shortLabel: 'ไลน์',
		tone: 'blue',
		icon: (
			<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
			</svg>
		),
	},
	{
		id: 'operators',
		label: 'ผู้ปฏิบัติงาน',
		shortLabel: 'ทีม',
		tone: 'green',
		icon: (
			<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
		),
	},
];

const TAB_TONES = {
	amber: {
		active: 'border-amber-200 bg-amber-50 text-amber-700',
		icon: 'bg-amber-100 text-amber-700',
	},
	blue: {
		active: 'border-sky-200 bg-sky-50 text-sky-700',
		icon: 'bg-sky-100 text-sky-700',
	},
	green: {
		active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
		icon: 'bg-emerald-100 text-emerald-700',
	},
};

function formatShortDate(value) {
	if (!value) {
		return '—';
	}

	return new Date(value).toLocaleDateString('th-TH');
}

function formatShortTime(value) {
	if (!value) {
		return '—';
	}

	return new Date(value).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function getOperatorCount(logs) {
	return new Set(logs.map((log) => log.operator || 'ไม่ระบุชื่อ (Unknown)')).size;
}

function ReportTabs({ activeTab, onChange, counts }) {
	return (
		<div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
			{TABS.map((tab) => {
				const isActive = tab.id === activeTab;
				const tone = TAB_TONES[tab.tone];
				return (
					<button
						key={tab.id}
						type="button"
						onClick={() => onChange(tab.id)}
						className={joinClasses(
							'flex shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors',
							isActive ? tone.active : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900',
						)}
					>
						<span className={joinClasses('flex h-9 w-9 items-center justify-center rounded-xl', isActive ? tone.icon : 'bg-slate-100 text-slate-500')}>
							{tab.icon}
						</span>
						<span className="min-w-0">
							<span className="block truncate text-sm font-bold">{tab.label}</span>
							<span className="block text-xs font-medium opacity-70">{counts[tab.id] || 0} รายการ</span>
						</span>
					</button>
				);
			})}
		</div>
	);
}

function TrayLogsViewPanel({ tray }) {
	const [logs, setLogs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		const loadLogs = async () => {
			try {
				setError('');
				setLoading(true);
				const data = await getLogs({ tray_id: tray.tray_id });
				setLogs(data);
			} catch (err) {
				setError(err.message || 'โหลดประวัติการทำงานไม่สำเร็จ');
			} finally {
				setLoading(false);
			}
		};

		loadLogs();
	}, [tray.tray_id]);

	return (
		<div className="mt-4 border-t border-slate-100 pt-4">
			<h4 className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">ประวัติการทำงาน</h4>
			<div className="mt-3">
				{loading ? <LoadingState message="กำลังโหลดประวัติการทำงาน..." /> : null}
				{!loading && error ? <ErrorState message={error} /> : null}
				{!loading && !error && logs.length === 0 ? (
					<EmptyState title="ยังไม่มีประวัติการผลิต" description="ระบบยังไม่พบ log ของงานรายการนี้" />
				) : null}
				{!loading && !error && logs.length > 0 ? (
					<Stack className="space-y-3">
						{logs.map((log) => (
							<div key={log.id} className="flex items-start justify-between gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-3">
								<div className="min-w-0 space-y-1">
									<div className="text-sm font-semibold text-slate-900">
										<span className="mr-1.5 text-slate-400">#{log.sequence}</span>
										{log.process_name}
									</div>
									<div className="text-xs text-slate-500">
										{log.operator || '—'}
										{' • '}
										{formatShortTime(log.logged_at)}
									</div>
								</div>
								<Badge color={ACTION_BADGE_COLORS[log.action] || 'gray'}>{ACTION_LABELS[log.action] || log.action}</Badge>
							</div>
						))}
					</Stack>
				) : null}
			</div>
		</div>
	);
}

function TrayReportPanel({ data, logs, search, onSearch }) {
	const [selectedTrayId, setSelectedTrayId] = useState(null);
	const [statusFilter, setStatusFilter] = useState('all');

	const latestLogByTray = [...logs]
		.sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))
		.reduce((acc, log) => {
			const key = String(log.tray_id);
			if (!acc[key]) {
				acc[key] = log;
			}
			return acc;
		}, {});

	const now = new Date();
	const withDelay = data.map((row) => ({
		...row,
		isDelayed: row.due_date && new Date(row.due_date) < now && row.status !== 'completed',
	}));

	const counts = {
		all: withDelay.length,
		in_progress: withDelay.filter((row) => row.status === 'in_progress').length,
		pending: withDelay.filter((row) => row.status === 'pending').length,
		completed: withDelay.filter((row) => row.status === 'completed').length,
		delayed: withDelay.filter((row) => row.isDelayed).length,
	};

	const filtered = withDelay.filter((row) => {
		const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'delayed' ? row.isDelayed : row.status === statusFilter;
		const keyword = search.trim().toLowerCase();
		const matchesSearch =
			!keyword ||
			row.qr_code.toLowerCase().includes(keyword) ||
			(row.product || '').toLowerCase().includes(keyword) ||
			(row.line_name || '').toLowerCase().includes(keyword);

		return matchesStatus && matchesSearch;
	});

	const filters = [
		{ id: 'all', label: 'ทั้งหมด', count: counts.all },
		{ id: 'in_progress', label: 'กำลังทำ', count: counts.in_progress },
		{ id: 'pending', label: 'รอเริ่ม', count: counts.pending },
		{ id: 'completed', label: 'เสร็จ', count: counts.completed },
		{ id: 'delayed', label: 'ล่าช้า', count: counts.delayed },
	];

	return (
		<div className="space-y-4">
			<div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
				{filters.map((filter) => (
					<button
						key={filter.id}
						type="button"
						onClick={() => setStatusFilter(filter.id)}
						className={joinClasses(
							'shrink-0 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
							statusFilter === filter.id
								? 'border-slate-900 bg-slate-900 text-white'
								: 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900',
						)}
					>
						{filter.label}: {filter.count}
					</button>
				))}
			</div>

			<SearchInput placeholder="ค้นหา QR Code, สินค้า หรือสายการผลิต" value={search} onChange={(event) => onSearch(event.target.value)} />

			{filtered.length === 0 ? (
				<EmptyState title="ไม่พบข้อมูลที่ค้นหา" description="ลองเปลี่ยนคำค้นหรือเลือกสถานะอื่น" />
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
					{filtered.map((row) => {
						const latest = latestLogByTray[String(row.tray_id)] || null;
						const isExpanded = selectedTrayId === row.tray_id;

						return (
							<MobileCard
								key={row.tray_id}
								className={joinClasses(
									'cursor-pointer border-2 transition-all',
									isExpanded ? 'border-amber-300 ring-2 ring-amber-50' : row.isDelayed ? 'border-red-200 bg-red-50/40' : 'border-slate-200 hover:border-amber-200',
								)}
							>
								<button type="button" className="w-full text-left" onClick={() => setSelectedTrayId((prev) => (prev === row.tray_id ? null : row.tray_id))}>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<h3 className="truncate font-mono text-lg font-black tracking-tight text-slate-900">{row.qr_code}</h3>
											<p className="mt-1 text-xs text-slate-500">{row.line_name || '—'}</p>
										</div>
										<div className="flex flex-col items-end gap-1.5">
											<Badge color={STATUS_BADGE_COLORS[row.status] || 'gray'}>{STATUS_LABELS[row.status] || row.status}</Badge>
											{row.isDelayed ? <Badge color="red">ล่าช้า</Badge> : null}
										</div>
									</div>

									<div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
										<div className="text-sm font-bold text-slate-900">{row.product || 'ไม่มีชื่อสินค้า'}</div>
										{row.batch_no ? <div className="mt-1 text-xs font-mono text-slate-500">Batch: {row.batch_no}</div> : null}
									</div>

									<div className="mt-4 flex items-end justify-between gap-3 text-xs">
										<div className="space-y-1 text-slate-500">
											<div className="font-medium text-slate-700">{latest ? latest.process_name : 'ยังไม่เริ่มงาน'}</div>
											<div>{latest?.operator || '—'}</div>
										</div>
										<div className="text-right">
											<div className="text-slate-400">กำหนดส่ง</div>
											<div className={joinClasses('font-semibold', row.isDelayed ? 'text-red-600' : 'text-slate-700')}>
												{formatShortDate(row.due_date)}
											</div>
										</div>
									</div>
								</button>
								{isExpanded ? <TrayLogsViewPanel tray={row} /> : null}
							</MobileCard>
						);
					})}
				</div>
			)}
		</div>
	);
}

function ProcessReportPanel({ logs, processes, lines, search, onSearch }) {
	const [expandedLineId, setExpandedLineId] = useState(null);

	const sortedLogs = [...logs].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	const latestByTask = sortedLogs.reduce((acc, log) => {
		const taskKey = `${log.tray_id}-${log.process_id}`;
		if (!acc[taskKey]) {
			acc[taskKey] = log;
		}
		return acc;
	}, {});

	const activeByProcess = Object.values(latestByTask).reduce((acc, log) => {
		if (log.action !== 'start') {
			return acc;
		}

		const processKey = String(log.process_id);
		if (!acc[processKey]) {
			acc[processKey] = [];
		}

		acc[processKey].push({ qr_code: log.qr_code, logged_at: log.logged_at });
		return acc;
	}, {});

	const statsByProcess = processes.reduce((acc, processItem) => {
		acc[processItem.id] = {
			id: processItem.id,
			line_id: processItem.line_id,
			process: processItem.name,
			seq: processItem.sequence,
			activeItems: (activeByProcess[processItem.id] || []).sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at)),
			start: 0,
			finish: 0,
			ng: 0,
		};
		return acc;
	}, {});

	logs.forEach((log) => {
		const processId = log.process_id;
		if (statsByProcess[processId]) {
			if (log.action === 'start') statsByProcess[processId].start += 1;
			if (log.action === 'finish') statsByProcess[processId].finish += 1;
			if (log.action === 'ng') statsByProcess[processId].ng += 1;
		}
	});

	const keyword = search.trim().toLowerCase();

	const lineData = lines.map((line) => {
		const processItems = Object.values(statsByProcess)
			.filter((processItem) => processItem.line_id === line.id)
			.sort((a, b) => a.seq - b.seq);

		let finishToday = 0;
		let ngToday = 0;

		logs.forEach((log) => {
			const processItem = statsByProcess[log.process_id];
			if (processItem && processItem.line_id === line.id) {
				const loggedAt = new Date(log.logged_at);
				if (loggedAt >= todayStart) {
					if (log.action === 'finish') finishToday += 1;
					if (log.action === 'ng') ngToday += 1;
				}
			}
		});

		return { ...line, finishToday, ngToday, processes: processItems };
	}).filter((line) => {
		if (!keyword) {
			return true;
		}

		return (
			line.name.toLowerCase().includes(keyword) ||
			line.processes.some((processItem) => processItem.process.toLowerCase().includes(keyword))
		);
	});

	if (lineData.length === 0) {
		return (
			<div className="space-y-4">
				<SearchInput placeholder="ค้นหาชื่อสายการผลิตหรือชื่อขั้นตอน" value={search} onChange={(event) => onSearch(event.target.value)} />
				<EmptyState
					title={keyword ? 'ไม่พบสายการผลิตที่ค้นหา' : 'ไม่มีข้อมูลสายการผลิต'}
					description={keyword ? 'ลองเปลี่ยนคำค้น หรือค้นหาด้วยชื่อขั้นตอนอื่น' : 'ยังไม่พบ line หรือข้อมูลขั้นตอนในระบบรายงาน'}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<SearchInput placeholder="ค้นหาชื่อสายการผลิตหรือชื่อขั้นตอน" value={search} onChange={(event) => onSearch(event.target.value)} />
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			{lineData.map((line) => {
				const isExpanded = expandedLineId === line.id;
				return (
					<MobileCard key={line.id} className={joinClasses('border-2 transition-all', isExpanded ? 'border-sky-300 ring-2 ring-sky-50' : 'border-slate-200')}>
						<button type="button" className="w-full text-left" onClick={() => setExpandedLineId((prev) => (prev === line.id ? null : line.id))}>
							<div className="flex items-start gap-3">
								<div className={joinClasses('flex h-10 w-10 items-center justify-center rounded-xl', isExpanded ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500')}>
									<svg className={joinClasses('h-5 w-5 transition-transform', isExpanded ? 'rotate-90' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
									</svg>
								</div>
								<div className="min-w-0 flex-1">
									<h3 className="text-lg font-bold text-slate-900">{line.name}</h3>
									<p className="mt-1 text-xs text-slate-500">{line.processes.length} ขั้นตอนการผลิต</p>
								</div>
							</div>

							<div className="mt-4 grid grid-cols-2 gap-3">
								<div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-center">
									<div className="text-xs font-semibold text-emerald-700">วันนี้เสร็จ (OK)</div>
									<div className="mt-1 text-2xl font-black text-emerald-700">{line.finishToday}</div>
								</div>
								<div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-center">
									<div className="text-xs font-semibold text-red-700">วันนี้เสีย (NG)</div>
									<div className="mt-1 text-2xl font-black text-red-700">{line.ngToday}</div>
								</div>
							</div>
						</button>

						{isExpanded ? (
							<div className="mt-5 border-t border-slate-100 pt-5">
								<h4 className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">รายละเอียดแยกตามขั้นตอน</h4>
								{line.processes.length === 0 ? (
									<EmptyState title="ยังไม่มีขั้นตอนในสายการผลิตนี้" description="เพิ่ม process เพื่อให้ระบบแสดงรายละเอียดในรายงานได้" />
								) : (
									<Stack className="space-y-3">
										{line.processes.map((processItem) => (
											<div key={processItem.id} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
												<div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
													<span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs text-sky-700">{processItem.seq}</span>
													{processItem.process}
												</div>
												<div className="grid grid-cols-3 gap-2 text-center text-xs">
													<div className="rounded-xl border border-slate-200 bg-white py-2">
														<div className="text-slate-400">เริ่มงาน</div>
														<div className="font-bold text-sky-700">{processItem.start}</div>
													</div>
													<div className="rounded-xl border border-slate-200 bg-white py-2">
														<div className="text-slate-400">เสร็จสิ้น</div>
														<div className="font-bold text-emerald-700">{processItem.finish}</div>
													</div>
													<div className="rounded-xl border border-slate-200 bg-white py-2">
														<div className="text-slate-400">ของเสีย</div>
														<div className="font-bold text-red-700">{processItem.ng}</div>
													</div>
												</div>
												<div className="mt-3 border-t border-dashed border-slate-200 pt-3">
													<div className="mb-2 text-[11px] text-slate-500">กำลังทำอยู่ ({processItem.activeItems.length})</div>
													{processItem.activeItems.length > 0 ? (
														<div className="flex flex-wrap gap-1.5">
															{processItem.activeItems.slice(0, 5).map((item) => (
																<Badge key={`${item.qr_code}-${item.logged_at}`} color="blue" className="font-mono">
																	{item.qr_code}
																</Badge>
															))}
															{processItem.activeItems.length > 5 ? <Badge color="gray">+{processItem.activeItems.length - 5}</Badge> : null}
														</div>
													) : (
														<div className="text-xs italic text-slate-400">—</div>
													)}
												</div>
											</div>
										))}
									</Stack>
								)}
							</div>
						) : null}
					</MobileCard>
				);
			})}
			</div>
		</div>
	);
}

function OperatorReportPanel({ logs, search, onSearch }) {
	const [expandedOperator, setExpandedOperator] = useState(null);
	const historyLimit = 5;

	const sortedLogs = [...logs].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));

	const latestByTask = sortedLogs.reduce((acc, log) => {
		const key = `${log.tray_id}-${log.process_id}`;
		if (!acc[key]) {
			acc[key] = log;
		}
		return acc;
	}, {});

	const stats = sortedLogs.reduce((acc, log) => {
		const operatorName = log.operator || 'ไม่ระบุชื่อ (Unknown)';
		if (!acc[operatorName]) {
			acc[operatorName] = { name: operatorName, start: 0, finish: 0, ng: 0, latestLog: log, history: [] };
		}
		if (log.action === 'start') acc[operatorName].start += 1;
		if (log.action === 'finish') acc[operatorName].finish += 1;
		if (log.action === 'ng') acc[operatorName].ng += 1;
		acc[operatorName].history.push(log);
		return acc;
	}, {});

	Object.values(stats).forEach((row) => {
		const activeLogs = Object.values(latestByTask).filter(
			(taskLog) => taskLog.action === 'start' && (taskLog.operator || 'ไม่ระบุชื่อ (Unknown)') === row.name,
		);
		row.currentTask = activeLogs.sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))[0] || null;
	});

	const keyword = search.trim().toLowerCase();
	const rows = Object.values(stats)
		.filter((row) => {
			if (!keyword) {
				return true;
			}

			return (
				row.name.toLowerCase().includes(keyword) ||
				row.history.some(
					(historyItem) =>
						historyItem.process_name.toLowerCase().includes(keyword) ||
						historyItem.qr_code.toLowerCase().includes(keyword),
				)
			);
		})
		.sort((a, b) => b.finish - a.finish);

	if (rows.length === 0) {
		return (
			<div className="space-y-4">
				<SearchInput placeholder="ค้นหาชื่อผู้ปฏิบัติงาน, ขั้นตอน หรือ QR Code" value={search} onChange={(event) => onSearch(event.target.value)} />
				<EmptyState
					title={keyword ? 'ไม่พบผู้ปฏิบัติงานที่ค้นหา' : 'ยังไม่มีประวัติการทำงานของผู้ปฏิบัติงาน'}
					description={keyword ? 'ลองเปลี่ยนคำค้น หรือค้นหาด้วยชื่อขั้นตอน/รหัสงาน' : 'ระบบยังไม่พบข้อมูลกิจกรรมของ operator'}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<SearchInput placeholder="ค้นหาชื่อผู้ปฏิบัติงาน, ขั้นตอน หรือ QR Code" value={search} onChange={(event) => onSearch(event.target.value)} />
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
			{rows.map((row) => {
				const isExpanded = expandedOperator === row.name;
				return (
					<MobileCard
						key={row.name}
						className={joinClasses('cursor-pointer border-2 transition-all', isExpanded ? 'border-emerald-300 ring-2 ring-emerald-50' : 'border-slate-200 hover:border-emerald-200')}
					>
						<button type="button" className="w-full text-left" onClick={() => setExpandedOperator((prev) => (prev === row.name ? null : row.name))}>
							<div className="flex items-center gap-3">
								<div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-emerald-200 bg-emerald-100 text-lg font-bold text-emerald-700">
									{row.name.charAt(0)}
								</div>
								<div className="min-w-0 flex-1">
									<div className="truncate text-lg font-bold text-slate-900">{row.name}</div>
									<Badge color="green" className="mt-1">ยอดงานเสร็จ: {row.finish}</Badge>
								</div>
							</div>

							<div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
								{row.currentTask ? (
									<>
										<div className="mb-1 flex items-center gap-2">
											<span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
											<span className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-700">กำลังทำอยู่</span>
										</div>
										<div className="truncate text-sm font-bold text-slate-900">{row.currentTask.process_name}</div>
										<div className="mt-1 font-mono text-xs text-slate-500">{row.currentTask.qr_code}</div>
									</>
								) : row.latestLog ? (
									<>
										<div className="mb-1 flex items-center gap-2">
											<span className="h-2 w-2 rounded-full bg-slate-400" />
											<span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">ทำล่าสุด</span>
										</div>
										<div className="truncate text-sm font-bold text-slate-900">{row.latestLog.process_name}</div>
										<div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500">
											<span className="font-mono">{row.latestLog.qr_code}</span>
											<span>{formatShortTime(row.latestLog.logged_at)}</span>
										</div>
									</>
								) : (
									<div className="text-center text-xs text-slate-400">— ไม่มีข้อมูลล่าสุด —</div>
								)}
							</div>
						</button>

						{isExpanded ? (
							<div className="mt-4 border-t border-slate-100 pt-4">
								<h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">ประวัติล่าสุด (สูงสุด {historyLimit} รายการ)</h4>
								<Stack className="space-y-2">
									{row.history.slice(0, historyLimit).map((historyItem) => (
										<div key={historyItem.id} className="flex items-center justify-between gap-3 text-xs">
											<div className="min-w-0 flex-1 pr-2">
												<div className="truncate font-semibold text-slate-700">{historyItem.process_name}</div>
												<div className="mt-0.5 flex justify-between gap-2 text-slate-400">
													<span className="truncate font-mono">{historyItem.qr_code}</span>
													<span>{formatShortTime(historyItem.logged_at)}</span>
												</div>
											</div>
											<Badge color={ACTION_BADGE_COLORS[historyItem.action] || 'gray'}>{ACTION_LABELS[historyItem.action] || historyItem.action}</Badge>
										</div>
									))}
								</Stack>
							</div>
						) : null}
					</MobileCard>
				);
			})}
			</div>
		</div>
	);
}

export default function ReportPage() {
	const [activeTab, setActiveTab] = useState('trays');
	const [summaryData, setSummaryData] = useState([]);
	const [logsData, setLogsData] = useState([]);
	const [processesData, setProcessesData] = useState([]);
	const [linesData, setLinesData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [search, setSearch] = useState('');

	const loadData = async () => {
		try {
			setLoading(true);
			setError('');
			const [summary, logs, processes, lines] = await Promise.all([
				getLogsSummary(),
				getLogs({ limit: 2000 }),
				getProcesses(),
				getLines(),
			]);
			setSummaryData(summary);
			setLogsData(logs);
			setProcessesData(processes);
			setLinesData(lines);
		} catch (err) {
			setError(err.message || 'โหลดข้อมูลรายงานไม่สำเร็จ');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	const currentTab = TABS.find((tab) => tab.id === activeTab) || TABS[0];
	const counts = {
		trays: summaryData.length,
		processes: linesData.length,
		operators: getOperatorCount(logsData),
	};

	const handleTabChange = (tabId) => {
		setActiveTab(tabId);
		setSearch('');
	};

	let content;
	if (loading) {
		content = <LoadingState message="กำลังรวบรวมข้อมูลรายงาน..." />;
	} else if (error) {
		content = <ErrorState message={error} onRetry={loadData} />;
	} else if (activeTab === 'trays') {
		content = <TrayReportPanel data={summaryData} logs={logsData} search={search} onSearch={setSearch} />;
	} else if (activeTab === 'processes') {
		content = <ProcessReportPanel logs={logsData} processes={processesData} lines={linesData} search={search} onSearch={setSearch} />;
	} else {
		content = <OperatorReportPanel logs={logsData} search={search} onSearch={setSearch} />;
	}

	return (
		<div className="min-h-screen bg-[#F2F2F7]">
			<main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-4 sm:px-6 md:px-8 md:py-6 sm:space-y-6">
				<AdminSection
					action={<ReportTabs activeTab={activeTab} onChange={handleTabChange} counts={counts} />}
				>
					{content}
				</AdminSection>
			</main>
		</div>
	);
}
