/**
 * Pure Net Cash Flow (NCF) calculation helpers.
 * Works both in the browser (window.NCFCalculator) and Node.js (module.exports).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NCFCalculator = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function toNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  /**
   * Sums line items where each item has { amount: number, type: 'inflow' | 'outflow' }.
   */
  function sumActivityItems(items) {
    if (!Array.isArray(items)) return 0;
    return items.reduce((acc, item) => {
      const mag = Math.abs(toNumber(item && item.amount));
      const sign = item && item.type === 'outflow' ? -1 : 1;
      return acc + sign * mag;
    }, 0);
  }

  /**
   * Calculates Net Cash Flow using the Activity Method:
   * NCF = Operating CF + Investing CF + Financing CF.
   */
  function calculateActivityNCF({ operating = [], investing = [], financing = [], beginningCash = 0 }) {
    const ocf = sumActivityItems(operating);
    const icf = sumActivityItems(investing);
    const fcf = sumActivityItems(financing);
    const ncf = ocf + icf + fcf;
    const start = toNumber(beginningCash);
    const endingCash = start + ncf;
    const changePct = start !== 0 ? (ncf / Math.abs(start)) * 100 : null;

    return {
      ocf,
      icf,
      fcf,
      ncf,
      beginningCash: start,
      endingCash,
      changePct
    };
  }

  /**
   * Calculates Net Cash Flow using Direct Inflows vs. Outflows:
   * NCF = Total Inflows - Total Outflows.
   */
  function calculateDirectNCF({ inflows = [], outflows = [], beginningCash = 0 }) {
    const totalInflows = (Array.isArray(inflows) ? inflows : []).reduce(
      (sum, item) => sum + Math.abs(toNumber(item && item.amount)),
      0
    );
    const totalOutflows = (Array.isArray(outflows) ? outflows : []).reduce(
      (sum, item) => sum + Math.abs(toNumber(item && item.amount)),
      0
    );
    const ncf = totalInflows - totalOutflows;
    const start = toNumber(beginningCash);
    const endingCash = start + ncf;
    const cashFlowMargin = totalInflows > 0 ? (ncf / totalInflows) * 100 : null;

    return {
      totalInflows,
      totalOutflows,
      ncf,
      beginningCash: start,
      endingCash,
      cashFlowMargin
    };
  }

  /**
   * Calculates multi-period NCF, cumulative cash balance, and discounted NPV.
   */
  function calculateMultiPeriodNCF({ periods = [], beginningCash = 0, discountRatePct = 0 }) {
    const start = toNumber(beginningCash);
    const rate = toNumber(discountRatePct) / 100;
    let cumulative = start;
    let totalInflows = 0;
    let totalOutflows = 0;
    let totalNCF = 0;
    let npv = 0;

    const rows = (Array.isArray(periods) ? periods : []).map((p, idx) => {
      const inflows = Math.abs(toNumber(p && p.inflows));
      const outflows = Math.abs(toNumber(p && p.outflows));
      const ncf = inflows - outflows;
      cumulative += ncf;
      totalInflows += inflows;
      totalOutflows += outflows;
      totalNCF += ncf;
      const discountFactor = Math.pow(1 + rate, idx + 1);
      const pv = discountFactor !== 0 ? ncf / discountFactor : ncf;
      npv += pv;

      return {
        label: (p && p.label) || `Period ${idx + 1}`,
        inflows,
        outflows,
        ncf,
        cumulativeCash: cumulative,
        presentValue: pv
      };
    });

    return {
      rows,
      beginningCash: start,
      endingCash: cumulative,
      totalInflows,
      totalOutflows,
      totalNCF,
      npv
    };
  }

  function formatMoney(amount, currencyCode = 'USD') {
    const val = toNumber(amount);
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
        maximumFractionDigits: currencyCode === 'JPY' ? 0 : 2
      }).format(val);
    } catch (_err) {
      return `${val.toFixed(2)} ${currencyCode}`;
    }
  }

  return {
    sumActivityItems,
    calculateActivityNCF,
    calculateDirectNCF,
    calculateMultiPeriodNCF,
    formatMoney
  };
});
