import React, { useState } from 'react';
import { PaymentHeader } from './PaymentHeader';
import { UpiAppTiles } from './UpiAppTiles';
import { OtherPaymentOptions, OtherPaymentMethodId } from './OtherPaymentOptions';
import { UpiQrModal } from './UpiQrModal';
import { UpiIntentLaunchModal } from './UpiIntentLaunchModal';
import { GatewayNoticeModal } from './GatewayNoticeModal';
import { UtrSubmissionStage } from './UtrSubmissionStage';
import { CartItem, OrderDetails } from '../../types';
import { UpiAppProvider } from '../../data/paymentConfig';

export interface PaymentInterfaceProps {
  total: number;
  subtotal: number;
  delivery: number;
  discount: number;
  items: CartItem[];
  orderNumber?: number | string;
  onBackToAddress: () => void;
  onConfirmCod: () => Promise<void>;
  onSubmitUtrReference: (utrNumber: string) => Promise<{ success: boolean; message: string }>;
  onProceedToConfirmation: () => void;
  isProcessing?: boolean;
}

export const PaymentInterface: React.FC<PaymentInterfaceProps> = ({
  total,
  subtotal,
  delivery,
  discount,
  items,
  orderNumber,
  onBackToAddress,
  onConfirmCod,
  onSubmitUtrReference,
  onProceedToConfirmation,
  isProcessing = false,
}) => {
  // Current active sub-flow: 'methods' | 'utr'
  const [activeStage, setActiveStage] = useState<'methods' | 'utr'>('methods');

  // Selected UPI App
  const [selectedUpiApp, setSelectedUpiApp] = useState<UpiAppProvider | null>(null);

  // Modals state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isIntentModalOpen, setIsIntentModalOpen] = useState(false);
  const [activeGatewayModalType, setActiveGatewayModalType] = useState<'card' | 'netbanking' | null>(null);

  // 1. Handle Selection of any of the 4 UPI Apps
  const handleSelectUpiApp = (app: UpiAppProvider) => {
    setSelectedUpiApp(app);
    setIsIntentModalOpen(true);
  };

  // 2. Handle Selection from "Other Payment Options"
  const handleSelectOtherOption = async (optionId: OtherPaymentMethodId) => {
    if (isProcessing) return;
    if (optionId === 'qr') {
      // CRITICAL REQUIREMENT 3: Open QR Modal only when clicked
      setIsQrModalOpen(true);
    } else if (optionId === 'card') {
      setActiveGatewayModalType('card');
    } else if (optionId === 'netbanking') {
      setActiveGatewayModalType('netbanking');
    } else if (optionId === 'cod') {
      await onConfirmCod();
    }
  };

  // 3. When customer finishes QR or Intent payment and taps "I've completed payment"
  const handleTransitionToUtr = () => {
    setIsQrModalOpen(false);
    setIsIntentModalOpen(false);
    setActiveStage('utr');
  };

  if (activeStage === 'utr') {
    return (
      <div className="w-full space-y-4">
        <UtrSubmissionStage
          orderNumberOrId={orderNumber || '101'}
          total={total}
          isSubmitting={isProcessing}
          onSubmitUtr={onSubmitUtrReference}
          onSkipOrLater={onProceedToConfirmation}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-5">
      {/* 1. PAYMENT PROVIDER HEADER (MATCHES SCREENSHOT) */}
      <PaymentHeader
        total={total}
        subtotal={subtotal}
        delivery={delivery}
        discount={discount}
        items={items}
        orderNumber={orderNumber}
        onBackOrClose={onBackToAddress}
      />

      {/* 2. MAIN PAYMENT CARD CONTAINER */}
      <div className="bg-[#FAF7F2] rounded-3xl p-4 sm:p-6 border border-[#E5DFD7] shadow-warm-xs space-y-6">
        {/* A. UPI APP TILES (4 EQUAL TILES: Any UPI, Paytm, Google Pay, PhonePe) */}
        <UpiAppTiles
          selectedApp={selectedUpiApp}
          onSelectApp={handleSelectUpiApp}
          disabled={isProcessing}
        />

        {/* B. OTHER PAYMENT OPTIONS CARD */}
        <OtherPaymentOptions
          onSelectOption={handleSelectOtherOption}
          codEnabled={true}
        />
      </div>

      {/* 3. DEDICATED QR MODAL (HIDDEN BY DEFAULT - VISIBLE ONLY WHEN OPENED) */}
      <UpiQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        total={total}
        orderNumberOrId={orderNumber || '101'}
        onProceedToUtrSubmission={handleTransitionToUtr}
      />

      {/* 4. INTENT LAUNCH MODAL */}
      {selectedUpiApp && (
        <UpiIntentLaunchModal
          isOpen={isIntentModalOpen}
          appProvider={selectedUpiApp}
          total={total}
          orderNumberOrId={orderNumber || '101'}
          onClose={() => setIsIntentModalOpen(false)}
          onSwitchToQr={() => {
            setIsIntentModalOpen(false);
            setIsQrModalOpen(true);
          }}
          onSelectAnotherApp={(provider) => setSelectedUpiApp(provider)}
          onProceedToUtr={handleTransitionToUtr}
        />
      )}

      {/* 5. GATEWAY INFORMATION MODAL */}
      <GatewayNoticeModal
        isOpen={activeGatewayModalType !== null}
        type={activeGatewayModalType}
        onClose={() => setActiveGatewayModalType(null)}
        onSelectUpi={() => {
          setActiveGatewayModalType(null);
          handleSelectUpiApp('any');
        }}
        onSelectCod={async () => {
          setActiveGatewayModalType(null);
          await onConfirmCod();
        }}
      />
    </div>
  );
};
