import React from 'react';
import { computeAmount, computeTotalSpace, formatINR } from '../utils/bill';
import { rupeesInWords } from '../utils/numberToWords';

const MIN_ROWS = 6;

function SummaryRow({ label, value, bold, show = true }) {
  return (
    <div className="bill-summary-row">
      <div className={`bill-summary-label ${bold ? 'bold' : ''}`}>{label}</div>
      <div className={`bill-summary-value ${bold ? 'bold' : ''}`}>
        {show && value ? value : '\u00A0'}
      </div>
    </div>
  );
}

const BillPreview = ({ data, totals }) => {
  const rows = [...data.items];
  while (rows.length < MIN_ROWS) rows.push(null);

  const words = rupeesInWords(totals.grandTotal);

  return (
    <div className="bill-print-area bill-sheet">
      {/* Header */}
      <div className="bill-header-grid">
        <div className="bill-header-left">
          <h1 className="bill-company-name">Shan Times</h1>
          <p className="bill-company-sub">(J.B.S. MASS COMMUNICATION)</p>
          <p className="bill-company-published">Published from Lucknow</p>
          <p className="bill-company-address">
            Registered Office : 175/41, Peer Jaleel (South), Near Qaiserbagh Bus Station,
            Lucknow-226018 (U.P.) India.
          </p>
          <p className="bill-company-address">
            Mobile : 9005008529, 9120967777 &nbsp; Email: shantimes2009@gmail.com
          </p>
        </div>
        <div className="bill-header-right">
          <div className="bill-header-right-top">
            <span className="bill-receipt-title">Bill / Receipt</span>
          </div>
          <p className="bill-gst-no">GST No.: 09AATFJ0454A1ZG</p>
          <div className="bill-meta-field">
            <span className="bill-meta-label">Bill No.</span>
            <span className="bill-meta-value">{data.billNo || '\u00A0'}</span>
          </div>
          <div className="bill-meta-field">
            <span className="bill-meta-label">Date</span>
            <span className="bill-meta-value">{data.billDate || '\u00A0'}</span>
          </div>
        </div>
      </div>

      {/* Client block */}
      <div className="bill-client-grid">
        <div className="bill-client-left">
          <div className="bill-client-to">
            <span className="bill-client-to-label">To,</span>
          </div>
          <p className="bill-client-name">{data.to || '\u00A0'}</p>
          <div className="bill-client-detail">
            <span className="bill-client-detail-label">GST No.</span>
            <span>{data.clientGst}</span>
          </div>
          <div className="bill-client-detail">
            <span className="bill-client-detail-label">CLIENT/REF</span>
            <span>{data.clientRef}</span>
          </div>
          <div className="bill-client-detail">
            <span className="bill-client-detail-label">RELEASE ORDER No.</span>
            <span>{data.releaseOrderNo}</span>
          </div>
        </div>
        <div className="bill-client-right">
          <div className="bill-meta-field">
            <span className="bill-meta-label">Date</span>
            <span className="bill-meta-value">{data.releaseOrderDate || '\u00A0'}</span>
          </div>
        </div>
      </div>

      {/* Items table */}
      <table className="bill-items-table">
        <colgroup>
          <col style={{ width: '15%' }} />
          <col style={{ width: '37%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '16%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>Date of Publication</th>
            <th>PARTICULARS</th>
            <th>Words/ Size</th>
            <th>Total Space</th>
            <th>Rate (Rs.)</th>
            <th>Amount (Rs.)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((it, i) => (
            <tr key={it ? it.id : `empty-${i}`}>
              <td>{it ? it.dateOfPublication : '\u00A0'}</td>
              <td className="bill-td-wrap">{it ? it.particulars : '\u00A0'}</td>
              <td className="bill-td-center bill-td-wrap">{it ? it.wordsSize : ''}</td>
              <td className="bill-td-center">
                {it && computeTotalSpace(it) ? computeTotalSpace(it) : it ? it.totalSpace : ''}
              </td>
              <td className="bill-td-right bill-td-tabular">
                {it && it.rate ? formatINR(parseFloat(it.rate.replace(/[^0-9.-]/g, '')) || 0) : ''}
              </td>
              <td className="bill-td-right bill-td-tabular">
                {it && computeAmount(it) ? formatINR(computeAmount(it)) : ''}
              </td>
            </tr>
          ))}

          {/* Summary block */}
          <tr className="bill-summary-block">
            <td colSpan={4} className="bill-words-cell">
              <div className="bill-words-inner">
                <p>
                  <span className="bill-words-label">Rupees In Words : </span>
                  <span className="bill-words-text">{words}</span>
                </p>
              </div>
            </td>
            <td colSpan={2} className="bill-totals-cell">
              <SummaryRow label="Total" value={formatINR(totals.subtotal)} />
              <SummaryRow 
                label={`Less: Agency Commission (${data.adCommissionPercent || 0}%)`} 
                value={formatINR(totals.adCommission)}
                show={totals.adCommission > 0} 
              />
              <SummaryRow label="Net Amount Before Tax" value={formatINR(totals.netAmount)} />
              <SummaryRow
                label="Add. IGST 5%"
                value={formatINR(totals.igst)}
                show={data.taxType === 'inter'}
              />
              <SummaryRow
                label="Add. CGST 2.5%"
                value={formatINR(totals.cgst)}
                show={data.taxType === 'intra'}
              />
              <SummaryRow
                label="Add. SGST 2.5%"
                value={formatINR(totals.sgst)}
                show={data.taxType === 'intra'}
              />
              <SummaryRow label="Grand Total" value={formatINR(totals.grandTotal)} bold />
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div className="bill-footer-grid">
        <div className="bill-footer-left">
          <p>R.N.I. No.: UPHIN/2009/30284 &nbsp; DAVP Code : 130965</p>
          <p>All Cheque &amp; Draft should be draw in favour of J.B.S. MASS COMMUNICATION</p>
          <p className="bill-footer-bank">
            BOMBAY MERCANTILE CO-OPERATIVE BANK IFSC CODE : BMCB0000049 - A/C No. 205110100016392
          </p>
          <p className="bill-footer-bank">
            CANARA BANK - IFSC Code : CNRB0018492 - A/c No. 120002975717 &nbsp;&nbsp; PAN No.
            AATFJ0454A
          </p>
        </div>
        <div className="bill-footer-right">
          <p className="bill-footer-for">
            For : <span className="bill-footer-company">Shan Times</span>
          </p>
          <p className="bill-footer-manager">Manager Advt.</p>
        </div>
      </div>
    </div>
  );
};

export default BillPreview;
