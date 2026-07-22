import MeasurementScanner from '@/components/measurement/MeasurementScanner';

export const metadata = {
  title: 'Body Measurement Scanner - Style Savant',
  description: 'AI-powered body measurement using your phone camera',
};

export default function MeasurementPage() {
  return (
    <div className="min-h-screen bg-background">
      <MeasurementScanner />
    </div>
  );
}
