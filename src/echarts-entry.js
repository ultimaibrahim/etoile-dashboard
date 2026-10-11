/**
 * src/echarts-entry.js — Build propio de ECharts (tree-shaking real).
 * Solo se incluyen los módulos que Étoile usa o tiene en el roadmap (pilar C).
 * Genera js/vendor/echarts.custom.min.js con `node scripts/build-echarts.js`; expone window.echarts.
 */
import * as echarts from 'echarts/core';
import { LineChart, BarChart, PieChart, ScatterChart, HeatmapChart } from 'echarts/charts';
import {
  GridComponent, TooltipComponent, LegendComponent, DataZoomComponent,
  MarkAreaComponent, MarkLineComponent, VisualMapComponent, CalendarComponent, BrushComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { UniversalTransition, LabelLayout } from 'echarts/features';

echarts.use([
  LineChart, BarChart, PieChart, ScatterChart, HeatmapChart,
  GridComponent, TooltipComponent, LegendComponent, DataZoomComponent,
  MarkAreaComponent, MarkLineComponent, VisualMapComponent, CalendarComponent, BrushComponent,
  CanvasRenderer, UniversalTransition, LabelLayout
]);

window.echarts = echarts;
