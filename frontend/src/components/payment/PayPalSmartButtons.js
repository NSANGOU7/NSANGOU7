import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID;

/**
 * PayPal Smart Buttons - works on mobile (Android/iOS) and desktop.
 *
 * Props:
 *  - orderId: internal order id (from /api/orders response)
 *  - onSuccess(captureData): called after successful capture
 *  - onError(err): called on error
 */
const PayPalSmartButtons = ({ orderId, onSuccess, onError }) => {
  if (!PAYPAL_CLIENT_ID) {
    return (
      <div className="p-3 bg-amber-50 border border-amber-200 text-sm text-amber-800 rounded">
        PayPal n'est pas encore configuré (clé manquante).
      </div>
    );
  }

  return (
    <div data-testid="paypal-smart-buttons" className="w-full">
      <PayPalScriptProvider
        options={{
          'client-id': PAYPAL_CLIENT_ID,
          currency: 'EUR',
          intent: 'capture',
          'disable-funding': 'paylater,credit',
        }}
      >
        <PayPalButtons
          style={{ layout: 'vertical', shape: 'rect', label: 'pay', height: 48 }}
          forceReRender={[orderId]}
          createOrder={async () => {
            try {
              const res = await axios.post(
                `${API_URL}/api/paypal/create-order`,
                { order_id: orderId },
                { withCredentials: true }
              );
              return res.data.paypal_order_id;
            } catch (err) {
              toast.error("Erreur création PayPal: " + (err.response?.data?.detail || err.message));
              throw err;
            }
          }}
          onApprove={async (data) => {
            try {
              const res = await axios.post(
                `${API_URL}/api/paypal/capture-order/${data.orderID}`,
                {},
                { withCredentials: true }
              );
              if (res.data.status === 'COMPLETED') {
                toast.success('Paiement PayPal validé ✅');
                if (onSuccess) onSuccess(res.data);
              } else {
                toast.error('Paiement en attente: ' + res.data.status);
              }
            } catch (err) {
              toast.error('Erreur capture PayPal');
              if (onError) onError(err);
            }
          }}
          onError={(err) => {
            console.error('PayPal error:', err);
            toast.error('Erreur PayPal');
            if (onError) onError(err);
          }}
          onCancel={() => {
            toast.info('Paiement annulé');
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
};

export default PayPalSmartButtons;
