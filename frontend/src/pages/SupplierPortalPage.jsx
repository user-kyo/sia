import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useToast } from '../components/ui/Toast';

const PROCUREMENT_SYNC_CHANNEL = 'sia_procurements_updated';

export default function SupplierPortalPage() {
  const toast = useToast();
  const { id } = useParams();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [costs, setCosts] = useState({});
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:8000/api/v1/procurements/public/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('PO not found or unauthorized');
        return res.json();
      })
      .then(data => {
        setPo(data);
        const initialCosts = {};
        data.items.forEach((item, idx) => {
          initialCosts[idx] = item.unit_price || 0;
        });
        setCosts(initialCosts);
      })
      .catch(err => {
        toast(err.message, 'error');
      })
      .finally(() => setLoading(false));
  }, [id, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceUrl) {
      toast('Please provide an invoice link', 'error');
      return;
    }

    setSubmitting(true);
    const updatedItems = po.items.map((item, idx) => ({
      ...item,
      unit_price: Number(costs[idx] || 0),
      line_total: item.quantity * Number(costs[idx] || 0)
    }));

    try {
      const res = await fetch(`http://localhost:8000/api/v1/procurements/public/${id}/submit-invoice`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: updatedItems,
          invoice_url: invoiceUrl
        })
      });

      if (!res.ok) throw new Error('Failed to submit invoice');
      localStorage.setItem(PROCUREMENT_SYNC_CHANNEL, String(Date.now()));
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel(PROCUREMENT_SYNC_CHANNEL);
        channel.postMessage({ type: 'invoice_submitted', poId: id });
        channel.close();
      }
      setSubmitted(true);
      toast('Invoice submitted successfully!', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Loading Order Details...</p></div>;
  
  if (!po) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Order not found or link expired.</p></div>;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invoice Submitted!</h2>
          <p className="text-gray-600">Thank you for confirming the order and providing your invoice. The buyer will process your order shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-indigo-600 px-6 py-8 sm:p-10">
            <h1 className="text-3xl font-extrabold text-white">Purchase Order Review</h1>
            <p className="mt-2 text-indigo-100">PO Number: {po.po_number}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="px-6 py-8 sm:p-10">
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Requested Items</h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Your Cost (per item)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {po.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.product_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <span className="text-gray-500 mr-2">₱</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              required
                              value={costs[idx]}
                              onChange={(e) => setCosts({...costs, [idx]: e.target.value})}
                              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Submission</h3>
              <p className="text-sm text-gray-500 mb-2">Please provide a link to your invoice document (e.g. Google Drive, Dropbox, or a public PDF link).</p>
              <input
                type="url"
                required
                placeholder="https://..."
                value={invoiceUrl}
                onChange={(e) => setInvoiceUrl(e.target.value)}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-3 border"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Invoice & Confirm'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
