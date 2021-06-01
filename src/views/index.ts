import MathView from './MathView';
import ImageView from './ImageView';
import IFrameView from './IFrameView';
import LinkView from './LinkView';
import CiteView from './CiteView';
import TimeView from './TimeView';
import createNodeView from './NodeView';
import WidgetView, { newWidgetView } from './WidgetView';

export type { NodeViewProps } from './types';

export default {
  createNodeView,
  MathView,
  ImageView,
  IFrameView,
  LinkView,
  TimeView,
  CiteView,
  WidgetView,
  newWidgetView,
};