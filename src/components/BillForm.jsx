import React from 'react';
import { computeAmount, computeTotalSpace, formatINR, newItem } from '../utils/bill';
import ScanRO from './ScanRO';

/**
 * Convert a native date input value (YYYY-MM-DD) to DD/MM/YYYY for display/storage.
 */
function toDisplayDate(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Convert a DD/MM/YYYY string to YYYY-MM-DD for native date input.
 */
function toInputDate(displayDate) {
  if (!displayDate) return '';
  const parts = displayDate.split('/');
  if (parts.length !== 3) return '';
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className="bill-field">
      <label className="bill-label">{label}</label>
      <input
        className="bill-input"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function DateField({ label, value, onChange, placeholder }) {
  return (
    <div className="bill-field">
      <label className="bill-label">{label}</label>
      <input
        className="bill-input"
        type="date"
        value={toInputDate(value)}
        placeholder={placeholder}
        onChange={(e) => onChange(toDisplayDate(e.target.value))}
      />
    </div>
  );
}

const BillForm = ({ data, setData }) => {
  const set = (key, value) =>
    setData((d) => ({ ...d, [key]: value }));

  const updateItem = (id, patch) =>
    setData((d) => ({
      ...d,
      items: d.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));

  const addItem = () =>
    setData((d) => ({ ...d, items: [...d.items, newItem()] }));

  const removeItem = (id) =>
    setData((d) => ({
      ...d,
      items: d.items.length > 1 ? d.items.filter((it) => it.id !== id) : d.items,
    }));

  const handleScanSuccess = (scanned) => {
    setData((d) => ({
      ...d,
      billNo: scanned.billNo || d.billNo,
      billDate: scanned.billDate || d.billDate,
      to: scanned.to || d.to,
      clientGst: scanned.clientGst || d.clientGst,
      clientRef: scanned.clientRef || d.clientRef,
      releaseOrderNo: scanned.releaseOrderNo || d.releaseOrderNo,
      releaseOrderDate: scanned.releaseOrderDate || d.releaseOrderDate,
      taxType: scanned.taxType || d.taxType,
      items: scanned.items && scanned.items.length > 0 
        ? scanned.items.map((it) => ({
            ...newItem(),
            dateOfPublication: it.dateOfPublication || '',
            particulars: it.particulars || '',
            wordsSize: it.wordsSize || '',
            totalSpace: it.totalSpace || '',
            rate: it.rate || '',
          }))
        : d.items,
    }));
  };

  return (
    <div className="bill-form-inner">
      <ScanRO onScanSuccess={handleScanSuccess} />

      {/* Bill meta */}
      <section className="bill-form-section">
        <h2 className="bill-section-title">
          <i className="fas fa-file-invoice"></i> Bill Details
        </h2>
        <div className="bill-form-grid-2">
          <Field
            label="Bill No."
            value={data.billNo}
            onChange={(v) => set('billNo', v)}
            placeholder="e.g. 1024"
          />
          <DateField
            label="Date"
            value={data.billDate}
            onChange={(v) => set('billDate', v)}
            placeholder="DD/MM/YYYY"
          />
        </div>
      </section>

      {/* Client */}
      <section className="bill-form-section">
        <h2 className="bill-section-title">
          <i className="fas fa-building"></i> Client
        </h2>
        <div className="bill-field">
          <label className="bill-label">To (name &amp; address)</label>
          <textarea
            className="bill-textarea"
            rows={3}
            value={data.to}
            placeholder={"Client Name\nFull address"}
            onChange={(e) => set('to', e.target.value)}
          />
        </div>
        <div className="bill-form-grid-2">
          <Field
            label="Client GST No."
            value={data.clientGst}
            onChange={(v) => set('clientGst', v)}
          />
          <Field
            label="Client / Ref"
            value={data.clientRef}
            onChange={(v) => set('clientRef', v)}
          />
          <Field
            label="Release Order No."
            value={data.releaseOrderNo}
            onChange={(v) => set('releaseOrderNo', v)}
          />
          <DateField
            label="Release Order Date"
            value={data.releaseOrderDate}
            onChange={(v) => set('releaseOrderDate', v)}
            placeholder="DD/MM/YYYY"
          />
        </div>
      </section>

      {/* Tax type */}
      <section className="bill-form-section">
        <h2 className="bill-section-title">
          <i className="fas fa-percentage"></i> Tax
        </h2>
        <div className="bill-form-grid-2">
          {[
            { key: 'intra', title: 'Within U.P.', sub: 'CGST 2.5% + SGST 2.5%' },
            { key: 'inter', title: 'Other State', sub: 'IGST 5%' },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => set('taxType', opt.key)}
              className={`bill-tax-option ${data.taxType === opt.key ? 'active' : ''}`}
            >
              <span className="bill-tax-title">{opt.title}</span>
              <span className="bill-tax-sub">{opt.sub}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Agency Commission */}
      <section className="bill-form-section">
        <h2 className="bill-section-title">
          <i className="fas fa-handshake"></i> Agency Commission
        </h2>
        <div className="bill-field">
          <Field
            label="Commission Percentage (%)"
            value={data.adCommissionPercent || ''}
            onChange={(v) => set('adCommissionPercent', v)}
            placeholder="e.g. 15"
          />
          <p className="bill-auto-hint">
            <i className="fas fa-info-circle"></i> This percentage will be deducted from the subtotal before taxes are applied.
          </p>
        </div>
      </section>

      {/* Line items */}
      <section className="bill-form-section">
        <div className="bill-section-header">
          <h2 className="bill-section-title">
            <i className="fas fa-list"></i> Publication Entries
          </h2>
          <button type="button" className="bill-add-btn" onClick={addItem}>
            <i className="fas fa-plus"></i> Add Row
          </button>
        </div>

        <div className="bill-entries-list">
          {data.items.map((it, idx) => (
            <div key={it.id} className="bill-entry-card">
              <div className="bill-entry-header">
                <span className="bill-entry-number">Entry {idx + 1}</span>
                <button
                  type="button"
                  className="bill-remove-btn"
                  onClick={() => removeItem(it.id)}
                  disabled={data.items.length === 1}
                  aria-label="Remove entry"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
              <div className="bill-form-grid-2">
                <DateField
                  label="Date of Publication"
                  value={it.dateOfPublication}
                  onChange={(v) => updateItem(it.id, { dateOfPublication: v })}
                  placeholder="DD/MM/YYYY"
                />
                <Field
                  label="Words / Size"
                  value={it.wordsSize}
                  onChange={(v) => updateItem(it.id, { wordsSize: v })}
                  placeholder="e.g. 4x10 cm"
                />
              </div>
              <div className="bill-field" style={{ marginTop: '12px' }}>
                <label className="bill-label">Particulars</label>
                <textarea
                  className="bill-textarea"
                  rows={2}
                  value={it.particulars}
                  onChange={(e) => updateItem(it.id, { particulars: e.target.value })}
                  placeholder="Advertisement description"
                />
              </div>
              <div className="bill-form-grid-3" style={{ marginTop: '12px' }}>
                <div className="bill-field">
                  <label className="bill-label">Total Space</label>
                  <input
                    className="bill-input"
                    value={
                      it.totalSpaceTouched
                        ? it.totalSpace
                        : computeTotalSpace(it)
                          ? String(computeTotalSpace(it))
                          : it.totalSpace
                    }
                    onChange={(e) =>
                      updateItem(it.id, { totalSpace: e.target.value, totalSpaceTouched: true })
                    }
                    placeholder="e.g. 40"
                  />
                </div>
                <Field
                  label="Rate (Rs.)"
                  value={it.rate}
                  onChange={(v) => updateItem(it.id, { rate: v })}
                  placeholder="e.g. 50"
                />
                <div className="bill-field">
                  <label className="bill-label">Amount (Rs.)</label>
                  <input
                    className="bill-input"
                    value={
                      it.amountTouched
                        ? it.amount
                        : computeAmount(it)
                          ? formatINR(computeAmount(it))
                          : ''
                    }
                    onChange={(e) =>
                      updateItem(it.id, { amount: e.target.value, amountTouched: true })
                    }
                    placeholder="auto"
                  />
                </div>
              </div>
              {!it.totalSpaceTouched && computeTotalSpace(it) > 0 && /[x×*]/i.test(it.wordsSize) && (
                <p className="bill-auto-hint">
                  <i className="fas fa-magic"></i> Total Space auto-calculated from dimensions. Type to override.
                </p>
              )}
              {!it.amountTouched && computeAmount(it) > 0 && (
                <p className="bill-auto-hint">
                  <i className="fas fa-calculator"></i> Amount auto-calculated as Total Space × Rate. Type to override.
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default BillForm;
