// src/features/auditLogs/AuditLogsPage.tsx
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { fetchAuditLogs, setFilters, cleanupLogs } from '../../store/slices/auditLogsSlice';
import { Table, Form, Button, Spinner, Modal } from 'react-bootstrap';
import { format } from 'date-fns';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactDatePicker from 'react-datepicker';
import { parseISO } from 'date-fns';

export default function AuditLogsPage() {
    const dispatch = useAppDispatch();
    const { logs, loading, error, totalCount, filters } = useAppSelector((s) => s.auditLogs);
    const [showModal, setShowModal] = useState(false);
    const [selectedDetails, setSelectedDetails] = useState<string | null>(null);

    useEffect(() => {
        dispatch(fetchAuditLogs());
    }, [dispatch, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        dispatch(setFilters({ [name]: value, page: 1 }));
        dispatch(fetchAuditLogs());
    };


    const handleCleanup = async () => {
        await dispatch(cleanupLogs(90));
        dispatch(fetchAuditLogs());
    };

    const handleViewDetails = (details: string) => {
        setSelectedDetails(prettifyDetails(details));
        setShowModal(true);
    };

    const prettifyDetails = (raw: string) => {
        try {
            const parsed = JSON.parse(raw);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return raw;
        }
    };

    return (
        <div className="container mt-4">
            <h3>Audit Logs</h3>

            <Form className="d-flex gap-3 my-3 flex-wrap">
                <Form.Control
                    name="userId"
                    placeholder="User ID"
                    value={filters.userId || ''}
                    onChange={handleFilterChange}
                />
                <Form.Control
                    name="action"
                    placeholder="Action"
                    value={filters.action || ''}
                    onChange={handleFilterChange}
                />
                <ReactDatePicker
                    selected={filters.fromDate ? parseISO(filters.fromDate) : null}
                    onChange={(date: Date | null) =>
                        dispatch(setFilters({ fromDate: date ? date.toISOString().split('T')[0] : '', page: 1 }))
                    }
                    placeholderText="From Date"
                    dateFormat="yyyy-MM-dd"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    className="form-control"
                />

                <ReactDatePicker
                    selected={filters.toDate ? parseISO(filters.toDate) : null}
                    onChange={(date: Date | null) =>
                        dispatch(setFilters({ toDate: date ? date.toISOString().split('T')[0] : '', page: 1 }))
                    }
                    placeholderText="To Date"
                    dateFormat="yyyy-MM-dd"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    className="form-control"
                />
                <Button onClick={() => dispatch(fetchAuditLogs())}>Filter</Button>
                <Button variant="danger" onClick={handleCleanup}>
                    Cleanup
                </Button>
            </Form>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" />
                </div>
            ) : error ? (
                <p className="text-danger">{error}</p>
            ) : (
                <>
                    <Table striped bordered hover responsive size="sm">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>User ID</th>
                                <th>Action</th>
                                <th>Details</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id}>
                                    <td>{log.id}</td>
                                    <td>{log.userId}</td>
                                    <td>{log.action}</td>
                                    <td>
                                        <Button
                                            size="sm"
                                            variant="outline-primary"
                                            onClick={() => handleViewDetails(log.details)}
                                        >
                                            View
                                        </Button>
                                    </td>
                                    <td>{format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    <div className="d-flex justify-content-between align-items-center mt-2">
                        <small>Total: {totalCount}</small>
                        <div>
                            <Button
                                disabled={filters.page <= 1}
                                onClick={() => dispatch(setFilters({ page: filters.page - 1 }))}
                            >
                                Prev
                            </Button>
                            <span className="mx-2">{filters.page}</span>
                            <Button
                                disabled={logs.length < filters.pageSize}
                                onClick={() => dispatch(setFilters({ page: filters.page + 1 }))}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* === Details Modal === */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Audit Log Details</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                    <SyntaxHighlighter
                        language="json"
                        style={oneLight}
                        wrapLongLines
                        customStyle={{
                            background: '#f8f9fa',
                            borderRadius: '6px',
                            padding: '1rem',
                            fontSize: '0.9rem',
                        }}
                    >
                        {selectedDetails ?? ''}
                    </SyntaxHighlighter>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
