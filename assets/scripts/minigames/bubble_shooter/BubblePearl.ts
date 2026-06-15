import { _decorator, Component, Enum } from 'cc';
import { getPearlColorName, PearlColor } from './PearlColorSystem';

const { ccclass, property } = _decorator;

@ccclass('BubblePearl')
export class BubblePearl extends Component {
  @property({ type: Enum(PearlColor) })
  public color: PearlColor = PearlColor.Blue;

  @property
  public row = -1;

  @property
  public col = -1;

  public setData(color: PearlColor, row = -1, col = -1): void {
    this.color = color;
    this.row = row;
    this.col = col;
  }

  public get debugColorName(): string {
    return getPearlColorName(this.color);
  }
}
