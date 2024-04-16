import { BarChart2 } from 'lucide-react';
import { SVGAttributes } from 'react';

export default function ApplicationLogo(props: SVGAttributes<SVGElement>) {
    return (
        <BarChart2 { ...props } />
    );
}
