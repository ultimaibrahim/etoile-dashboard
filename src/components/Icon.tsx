import React from 'react';
import {
  Sun,
  Moon,
  ArrowLeft,
  Search,
  BarChart3,
  Calendar,
  Info,
  Home,
  Star,
  Check,
  AlertCircle,
  Clipboard,
  LogOut,
  Film
} from 'lucide-react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: 'sun' | 'moon' | 'arrow' | 'search' | 'barChart' | 'calendar' | 'info' | 'home' | 'starFilled' | 'star' | 'check' | 'alert' | 'clipboard' | 'logout' | 'cinema';
  size?: number;
}

export const Icon: React.FC<IconProps> = ({ name, size = 20, className, ...props }) => {
  // We type-cast style to bypass SVGProps typing mismatch if any
  const defaultStyles: React.CSSProperties = {
    display: 'inline-block',
    verticalAlign: 'middle',
    width: size,
    height: size,
    flexShrink: 0
  };

  // Convert SVGProps properties to what Lucide expects
  const lucideProps = {
    size,
    className,
    style: { ...defaultStyles, ...(props.style || {}) },
    ...props
  } as any;

  switch (name) {
    case 'sun':
      return <Sun {...lucideProps} />;
    case 'moon':
      return <Moon {...lucideProps} />;
    case 'arrow':
      return <ArrowLeft strokeWidth={2.4} {...lucideProps} />;
    case 'search':
      return <Search {...lucideProps} />;
    case 'barChart':
      return <BarChart3 {...lucideProps} />;
    case 'calendar':
      return <Calendar {...lucideProps} />;
    case 'info':
      return <Info {...lucideProps} />;
    case 'home':
      return <Home {...lucideProps} />;
    case 'starFilled':
      return <Star fill="currentColor" {...lucideProps} />;
    case 'star':
      return <Star {...lucideProps} />;
    case 'check':
      return <Check strokeWidth={2.5} {...lucideProps} />;
    case 'alert':
      return <AlertCircle {...lucideProps} />;
    case 'clipboard':
      return <Clipboard {...lucideProps} />;
    case 'logout':
      return <LogOut {...lucideProps} />;
    case 'cinema':
      return <Film {...lucideProps} />;
    default:
      return null;
  }
};

export default Icon;
