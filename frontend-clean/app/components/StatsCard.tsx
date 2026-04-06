// frontend/app/components/StatsCard.tsx
interface StatsCardProps {
    title: string;
    value: number;
}

export default function StatsCard({ title, value }: StatsCardProps) {
    return (
        <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
            <p className="text-3xl font-bold mt-2 text-gray-500">{value.toLocaleString()}</p>
        </div>
    );
}