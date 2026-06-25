import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import BillForm from '../components/BillForm';
import BillPreview from '../components/BillPreview';
import { computeTotals, formatINR, newItem } from '../utils/bill';

const emptyBill = () => ({
  billNo: '',
  billDate: '',
  to: '',
  clientGst: '',
  clientRef: '',
  releaseOrderNo: '',
  releaseOrderDate: '',
  taxType: 'intra',
  adCommissionPercent: '',
  items: [{ ...newItem(), id: 'item-1' }],
});

const BillMaker = () => {
  const [data, setData] = useState(emptyBill);
  const totals = useMemo(() => computeTotals(data), [data]);

  return (
    <div className="bill-maker-page">
      {/* Top bar */}
      <header className="bill-header-bar no-print">
        <div className="bill-header-bar-inner">
          <div className="bill-header-bar-left">
            <div className="bill-header-icon">
              <i className="fas fa-newspaper"></i>
            </div>
            <div>
              <h1 className="bill-header-title">Shan Times</h1>
              <p className="bill-header-subtitle">Bill / Receipt Generator</p>
            </div>
          </div>
          <div className="bill-header-bar-right">
            <Link to="/admin" className="bill-btn-ghost">
              <i className="fas fa-arrow-left"></i> Admin
            </Link>
            <button className="bill-btn-ghost" onClick={() => setData(emptyBill())}>
              <i className="fas fa-redo-alt"></i> Reset
            </button>
            <button className="bill-btn-primary" onClick={() => window.print()}>
              <i className="fas fa-print"></i> Print / Save PDF
            </button>
          </div>
        </div>
      </header>

      <div className="bill-maker-layout">
        {/* Form */}
        <div className="bill-form-panel no-print">
          <div className="bill-form-card">
            <BillForm data={data} setData={setData} />
          </div>
        </div>

        {/* Preview */}
        <div className="bill-preview-panel">
          <div className="bill-preview-header no-print">
            <h2 className="bill-preview-title">
              <i className="fas fa-eye"></i> Live Preview
            </h2>
            <div className="bill-grand-total-badge">
              <span className="bill-grand-total-label">Grand Total </span>
              <span className="bill-grand-total-value">₹ {formatINR(totals.grandTotal)}</span>
            </div>
          </div>
          <div className="bill-preview-wrapper">
            <BillPreview data={data} totals={totals} />
          </div>
          <p className="bill-print-hint no-print">
            Use "Print / Save PDF", then choose <strong>Save as PDF</strong> (landscape A4) in your browser print dialog.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BillMaker;
