import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

// Ícones da barra inferior — todos no mesmo estilo (traço de 2px, pontas
// arredondadas, grade 24×24, só contorno com pequenos preenchimentos), pra
// parecerem uma família. A cor vem de fora: laranja na aba ativa, cinza
// nas demais.
export type TabIconName = 'tuner' | 'metronome' | 'chords' | 'scales' | 'harmonicField';

interface TabIconProps {
  name: TabIconName;
  color: string;
  size?: number;
}

export function TabIcon({ name, color, size = 28 }: TabIconProps) {
  const stroke = {
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'tuner' && (
        // Diapasão: duas hastes em U + cabo
        <>
          <Path d="M8.5 2v8.5a3.5 3.5 0 0 0 7 0V2" {...stroke} />
          <Line x1={12} y1={14} x2={12} y2={22} {...stroke} />
        </>
      )}
      {name === 'metronome' && (
        // Metrônomo analógico: corpo em trapézio, base e pêndulo com peso
        <>
          <Path d="M9.5 2.5h5l4.5 19H5z" {...stroke} />
          <Line x1={6.2} y1={17} x2={17.8} y2={17} {...stroke} />
          <Line x1={12} y1={17} x2={14.5} y2={6.5} {...stroke} />
          <Circle cx={13.7} cy={10} r={1.6} fill={color} />
        </>
      )}
      {name === 'chords' && (
        // Diagrama de acorde: pestana grossa, 4 cordas, 2 trastes e duas notas
        <>
          <Line x1={3.5} y1={3.5} x2={20.5} y2={3.5} {...stroke} strokeWidth={3} />
          {[4, 9.33, 14.67, 20].map(x => (
            <Line key={x} x1={x} y1={3.5} x2={x} y2={21} {...stroke} strokeWidth={1.5} />
          ))}
          <Line x1={4} y1={10} x2={20} y2={10} {...stroke} strokeWidth={1.5} />
          <Line x1={4} y1={16.5} x2={20} y2={16.5} {...stroke} strokeWidth={1.5} />
          <Circle cx={9.33} cy={6.75} r={2.2} fill={color} />
          <Circle cx={14.67} cy={13.25} r={2.2} fill={color} />
        </>
      )}
      {name === 'scales' && (
        // Escala ascendente: três notas ligadas por uma barra
        <>
          <Circle cx={6.3} cy={18.5} r={2.3} fill={color} />
          <Circle cx={12.3} cy={15.5} r={2.3} fill={color} />
          <Circle cx={18.3} cy={12.5} r={2.3} fill={color} />
          <Line x1={8.6} y1={18.5} x2={8.6} y2={8} {...stroke} />
          <Line x1={14.6} y1={15.5} x2={14.6} y2={5.5} {...stroke} />
          <Line x1={20.6} y1={12.5} x2={20.6} y2={3} {...stroke} />
          <Line x1={8.6} y1={8} x2={20.6} y2={3} {...stroke} />
        </>
      )}
      {name === 'harmonicField' && (
        // Círculo das quintas: aros e a janela (preenchida) no topo
        <>
          <Path d="M10 8.54L7.25 3.77A9.5 9.5 0 0 1 16.75 3.77L14 8.54A4 4 0 0 0 10 8.54z" fill={color} />
          <Circle cx={12} cy={12} r={9.5} {...stroke} />
          <Circle cx={12} cy={12} r={4} {...stroke} />
          <Line x1={10} y1={8.54} x2={7.25} y2={3.77} {...stroke} />
          <Line x1={14} y1={8.54} x2={16.75} y2={3.77} {...stroke} />
        </>
      )}
    </Svg>
  );
}
