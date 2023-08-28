여태 공부 해오면서 Three나 Matter 등의 라이브러리를 활용한 canvas는 아주 살짝 맛을 본 적이 있지만 JS의 기본 Canvas API는 사용해 본 적이 없다.

따라서 간단한 아이디어를 구현하며 Canvas API의 기본 사용법에 대해 알아보기로 하였다.

프로젝트는 React 환경에서 진행하였다.

<br />

# **Dots**

![](https://velog.velcdn.com/images/drrobot409/post/beeae371-a343-4957-ad58-2b5742955d6d/image.png)

캔버스에 여러 점들을 찍어두고 마우스의 움직임에 따라 마우스와 인접한 점들이 따라 움직이는 아이디어를 구현해 보았다.

흔하게 볼 수 있는 아이디어지만 첫 Canvas API 사용인 만큼 간단하게 구현할 수 있는 아이디어로 선정하였다.

이후 소개할 두 번째 아이디어도 이 아이디어의 코드를 기반으로 하였다.

## **1. Canvas와 2D Context 생성**

캔버스와 컨텍스트, 그리고 컨테이너를 상태에 저장하고 준비 상태를 업데이트한다.

```tsx
const Dots = () => {
  const cvsRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const [cvs, setCvs] = useState<HTMLCanvasElement | null>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const isReady = useMemo(
    () => !!cvs && !!ctx && !!container,
    [cvs, ctx, container]
  );

  useEffect(() => {
    if (!containerRef.current || !cvsRef.current) return;

    setContainer(containerRef.current);
    setCvs(cvsRef.current);
    setCtx(cvsRef.current.getContext("2d"));
  }, []);

  return (
    <main ref={containerRef}>
      <canvas ref={cvsRef} />
    </main>
  );
};
```

<br />

## **2. 리사이즈 옵저버 등록**

캔버스의 부모(컨테이너) 요소에 리사이즈 옵저버를 등록하고 리사이즈 시 컨테이너의 사이즈를 상태에 저장한다.

이 상태는 이후 캔버스의 사이즈를 참조할 때 사용한다.

```tsx
const resizeObserver = useMemo(
  () =>
    new ResizeObserver(
      _.debounce((entries) => {
        for (const entry of entries) {
          const { inlineSize: width, blockSize: height } =
            entry.borderBoxSize[0];
          setCvsSize([width, height]); // 컨테이너의 크기를 상태에 저장
        }
      }, 100)
    ),
  [createDots]
);

useEffect(() => {
  if (!isReady) return;

  resizeObserver.observe(container as HTMLElement);

  return () => {
    resizeObserver.unobserve(container as HTMLElement);
  };
}, [container, isReady, resizeObserver]);
```

<br />

## **3. 영역 구분 및 점 생성**

캔버스에 점을 고르게 분포하기 위해 캔버스의 영역을 균일하게 나누고 각 영역당 하나의 점만 생성하는 방식을 사용하였다.

### **3-1. 영역 구분**

캔버스와 컨텍스트가 준비되면 캔버스의 사이즈를 지정하고 캔버스를 지정된 개수에 맞게 영역을 나눈다.

_(아래는 참고용으로 첨부한 스크린샷이며 현재 단계에서는 아직 요소들을 캔버스에 그리지 않는다.)_
![](https://velog.velcdn.com/images/drrobot409/post/738c50f4-7d01-4926-b8f0-12d812b2a794/image.png)

```tsx
// 캔버스 사이즈 지정
// 상태에 저장한 컨테이너의 사이즈 사용
cvs!.width = cvsWidth;
cvs!.height = cvsHeight;

// 캔버스 영역 구분 및 상태 저장
// 영역의 개수와 영역 사이의 여백을 고려하여 영역을 구분하고 상태에 저장한다.
// AREA_DIVIDE가 20일 경우, 10 * 10 = 100개의 칸으로 나누어지게 된다.
// 영역 구분
const areas: Array<Area> = [];
const areaWidth = (cvsWidth - AREA_GAP * AREA_DIVIDE) / AREA_DIVIDE;
const areaHeight = (cvsHeight - AREA_GAP * AREA_DIVIDE) / AREA_DIVIDE;

for (let i = 1; i <= AREA_DIVIDE; i++) {
  const startY = AREA_GAP / 2 + (areaHeight + AREA_GAP) * (i - 1);
  const endY = startY + areaHeight;

  for (let j = 1; j <= AREA_DIVIDE; j++) {
    const startX = AREA_GAP / 2 + (areaWidth + AREA_GAP) * (j - 1);
    const endX = startX + areaWidth;

    areas.push({
      startX,
      startY,
      endX,
      endY,
      width: areaWidth,
      height: areaHeight,
    });
  }
}

setAreas(areas);
```

<br />

### **3-2. 점 생성**

영역당 하나씩 랜덤한 위치에 점을 생성한다.

생성한 점은 캔버스에 바로 그리지 않고 상태에 저장해둔다.

_(아래는 참고용으로 첨부한 스크린샷이며 현재 단계에서는 아직 요소들을 캔버스에 그리지 않는다.)_

![](https://velog.velcdn.com/images/drrobot409/post/75afd0a4-4d7c-413a-8011-88a073990b9c/image.png)

```ts
const dots: Array<Dot> = [];

// 각 영역 내 랜덤 위치 구하기
for (const area of areas) {
  const { startX, endX, startY, endY } = area;
  const x = Math.floor(Math.random() * (endX - startX) + startX);
  const y = Math.floor(Math.random() * (endY - startY) + startY);

  const dot = {
    x,
    y,
    originX: x,
    originY: y,
    radius: 5,
    startAngle: 0,
    endAngle: Math.PI * 2,
    active: false,
  };

  dots.push(dot);
}

setDots(dots);
```

<br />

### **3-3. 하나의 함수로 합치기**

3-1과 3-2의 코드를 합쳐 하나의 함수로 만든다.

```ts
// 랜덤 위치에 고르게 점을 분포하는 함수
const createDots = useCallback(
  (cvsWidth: number, cvsHeight: number) => {
    if (!isReady) return;

    const { AREA_GAP, AREA_DIVIDE } = ENV;
    const dots: Array<Dot> = [];

    cvs!.width = cvsWidth;
    cvs!.height = cvsHeight;

    const areas: Array<Area> = [];
    const areaWidth = (cvsWidth - AREA_GAP * AREA_DIVIDE) / AREA_DIVIDE;
    const areaHeight = (cvsHeight - AREA_GAP * AREA_DIVIDE) / AREA_DIVIDE;

    for (let i = 1; i <= AREA_DIVIDE; i++) {
      const startY = AREA_GAP / 2 + (areaHeight + AREA_GAP) * (i - 1);
      const endY = startY + areaHeight;

      for (let j = 1; j <= AREA_DIVIDE; j++) {
        const startX = AREA_GAP / 2 + (areaWidth + AREA_GAP) * (j - 1);
        const endX = startX + areaWidth;

        areas.push({
          startX,
          startY,
          endX,
          endY,
          width: areaWidth,
          height: areaHeight,
        });
      }
    }

    setAreas(areas);

    for (const area of areas) {
      const { startX, endX, startY, endY } = area;
      const x = Math.floor(Math.random() * (endX - startX) + startX);
      const y = Math.floor(Math.random() * (endY - startY) + startY);

      const dot: Dot = {
        x,
        y,
        originX: x,
        originY: y,
        radius: 5,
        startAngle: 0,
        endAngle: Math.PI * 2,
        active: false,
      };

      dots.push(dot);
    }

    setDots(dots);
  },
  [isReady, cvs]
);
```

이 함수는 앞서 등록한 컨테이너 리사이즈 옵저버에 포함하여 최초 로드와 리사이즈시 영역과 점을 생성하도록 한다.

```ts
const resizeObserver = useMemo(
  () =>
    new ResizeObserver(
      _.debounce((entries) => {
        for (const entry of entries) {
          const { inlineSize: width, blockSize: height } =
            entry.borderBoxSize[0];
          setCvsSize([width, height]);
          createDots(width, height); // 여기
        }
      }, 100)
    ),
  [createDots]
);
```

<br />

## **4. 점 위치 업데이트**

마우스와 각 점 사이의 거리를 계산하고 그에 따라 점의 위치를 업데이트하는 함수를 작성한다.

마우스와 점 사이의 거리가 일정 값(`MOUSE_RANGE`) 이하일 경우 `active: true` 상태를 부여하고 점의 위치를 마우스 위치로 일정 거리 이동시킨다. 이후 마우스가 멀어져 `active: false` 상태가 될 경우 점을 다시 원래 위치로 복귀시킨다.

```ts
const updateDots = ({
  dotsSetter,
  mousePos,
  env,
}: {
  dotsSetter: Dispatch<SetStateAction<Array<Dot>>>;
  mousePos: [number, number];
  env: ENV;
}) => {
  const [mouseX, mouseY] = mousePos;

  dotsSetter((prev) => {
    const { MOUSE_RANGE, SPEED } = env;
    const newDots: Array<Dot> = [];

    for (const dot of prev) {
      // 마우스와 점 사이의 거리를 계산, 거리가 MOUSE_RANGE 이하일 경우 active
      const { x: dotX, originX, y: dotY, originY } = dot;
      const mouseDeltaX = mouseX - originX;
      const mouseDeltaY = mouseY - originY;
      const mouseDistance = Math.sqrt(mouseDeltaX ** 2 + mouseDeltaY ** 2);
      const active = mouseDistance <= MOUSE_RANGE ? true : false;
      let x, y, targetX, targetY: number;
      let curSpeed = SPEED;

      // active 여부에 따라 목표 지점을 결정
      if (active) {
        targetX = mouseX - mouseDeltaX * 0.7;
        targetY = mouseY - mouseDeltaY * 0.7;
      } else {
        targetX = originX;
        targetY = originY;
        curSpeed /= 5;
      }

      const deltaX = targetX - dotX; // 현재 x와 타겟 x의 거리
      const deltaY = targetY - dotY; // 현재 y와 타겟 y의 거리
      // 현재 점과 타겟 점 사이의 거리(유클리드 거리 공식)
      const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

      // 현재 속도보다 남은 거리가 클 경우
      // 속력을 계산해 위치를 업데이트한다.
      if (distance > curSpeed) {
        // 핸재 점(foot[x, y])에서 타겟 점(nearDot[x, y])을 바라보는 라디안 각도
        const angle = Math.atan2(deltaY, deltaX);
        // 속도와 각도를 통해 각 방향의 속력 구하기
        const velocityX = curSpeed * Math.cos(angle);
        const velocityY = curSpeed * Math.sin(angle);
        // 새로운 x,y 좌표 계산
        x = dotX + velocityX;
        y = dotY + velocityY;
        // 현재 속도보다 남은 거리가 작을 경우
        // 타겟 위치로 바로 이동한다.
      } else {
        x = targetX;
        y = targetY;
      }

      newDots.push({
        ...dot,
        active,
        x,
        y,
      });
    }

    return newDots;
  });
};
```

<br />

## **5. Shape 클래스**

위에서 계산한 점이나 다른 도형들을 캔버스에 그리기 위해 `Shape` 클래스를 만들었다.

`Shape` 클래스는 그릴 도형의 데이터를 인스턴스 속성으로 갖고 해당 속성을 바탕으로 캔버스에 도형을 그리는 인스턴스 메소드 `draw()`를 갖도록 하였다.

캔버스에 그릴 내용을 `Shape` 인스턴스로 만들고 순차적으로 큐에 등록하여 도형들을 캔버스에 그리도록 하였다.

도형을 바로 그리지 않고 이러한 과정을 거치는 이유는 큐 등록 순서로 도형의 중첩 순서를 관리하고 context의 drawing function을 모듈화하여 코드를 작성하고 관리하기 위함이다.

```tsx
class Shape {
  ctx: CanvasRenderingContext2D | null = ctx;
  line: Line | null;
  arc: Arc | null;
  ellipse: Ellipse | null;
  quadraticCurve: QuadraticCurve | null;
  fillRect: Rect | null;
  strokeRect: Rect | null;
  drawImage: DrawImage | null;
  radialGradient: RadialGradient | null;
  colorStops: ColorStops | null;
  clearRect: ClearRect | null;
  strokeStyle: string | null;
  fillStyle: string | null;
  lineWidth: number | null;

  constructor({
    line = null,
    arc = null,
    ellipse = null,
    quadraticCurve = null,
    fillRect = null,
    strokeRect = null,
    drawImage = null,
    radialGradient = null,
    colorStops = null,
    clearRect = null,
    strokeStyle = null,
    fillStyle = null,
    lineWidth = null,
  }: {
    line?: Line | null;
    arc?: Arc | null;
    ellipse?: Ellipse | null;
    quadraticCurve?: QuadraticCurve | null;
    fillRect?: Rect | null;
    strokeRect?: Rect | null;
    drawImage?: DrawImage | null;
    radialGradient?: RadialGradient | null;
    colorStops?: ColorStops | null;
    clearRect?: ClearRect | null;
    strokeStyle?: string | null;
    fillStyle?: string | null;
    lineWidth?: number | null;
  }) {
    this.line = line;
    this.arc = arc;
    this.ellipse = ellipse;
    this.quadraticCurve = quadraticCurve;
    this.fillRect = fillRect;
    this.strokeRect = strokeRect;
    this.drawImage = drawImage;
    this.radialGradient = radialGradient;
    this.colorStops = colorStops;
    this.clearRect = clearRect;
    this.strokeStyle = strokeStyle;
    this.fillStyle = fillStyle;
    this.lineWidth = lineWidth;
  }

  public draw() {
    if (!this.ctx) return;

    const ctx = this.ctx;
    ctx.beginPath();

    let gradient: CanvasGradient | null = null;
    if (!!this.radialGradient && !!this.colorStops) {
      const { x0, y0, r0, x1, y1, r1 } = this.radialGradient;
      gradient = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
      for (const colorStop of this.colorStops) {
        const [offset, color] = colorStop;
        gradient.addColorStop(offset, color);
      }
    }

    ctx.lineCap = "round";
    ctx.strokeStyle = this.strokeStyle || gradient || "";
    ctx.fillStyle = this.fillStyle || gradient || "";
    ctx.lineWidth = this.lineWidth || 1;

    if (!!this.clearRect) {
      const { x, y, width, height } = this.clearRect;
      ctx.clearRect(x, y, width, height);
    } else if (!!this.line) {
      const {
        moveTo: { x: moveX, y: moveY },
        lineTo: { x: lineX, y: lineY },
      } = this.line;
      ctx.moveTo(moveX, moveY);
      ctx.lineTo(lineX, lineY);
      ctx.stroke();
    } else if (!!this.arc) {
      const { x, y, radius, startAngle, endAngle } = this.arc;
      ctx.arc(x, y, radius, startAngle, endAngle);
      ctx.fill();
    } else if (!!this.ellipse) {
      const { x, y, radiusX, radiusY, rotation, startAngle, endAngle } =
        this.ellipse;
      ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle);
      ctx.fill();
    } else if (!!this.quadraticCurve) {
      const {
        moveTo: { x: moveX, y: moveY },
        quadraticCurveTo: { cpx, cpy, x, y },
      } = this.quadraticCurve;
      ctx.moveTo(moveX, moveY);
      ctx.quadraticCurveTo(cpx, cpy, x, y);
      ctx.stroke();
    } else if (!!this.fillRect) {
      const { x, y, width, height } = this.fillRect;
      ctx.fillRect(x, y, width, height);
    } else if (!!this.strokeRect) {
      const { x, y, width, height } = this.strokeRect;
      ctx.strokeRect(x, y, width, height);
    } else if (!!this.drawImage) {
      const { image, x, y, width, height } = this.drawImage;
      ctx.drawImage(image, x, y, width, height);
    }

    ctx.closePath();
  }
}
```

<br />

## **6. 그리기**

이제 점들의 데이터를 받아서 Shape 객체로 만든 후 캔버스에 순서대로 그리는 함수를 작성한다.

```ts
const draw = ({
  mousePos,
  cvsSize,
  env,
  Shape,
  areas,
  dots,
}: {
  mousePos: [number, number];
  cvsSize: [number, number];
  env: ENV;
  Shape: typeof shape;
  areas: Array<Area>;
  dots: Array<Dot>;
}) => {
  const { NEAR_DOT_COLOR, DOT_COLOR, LINE_COLOR } = env;
  const [mouseX, mouseY] = mousePos;
  const [cvsWidth, cvsHeight] = cvsSize;

  // draw를 순차적으로 실행할 큐
  // Shape 객체를 담는다.
  const drawQueue: Array<InstanceType<typeof Shape>> = [];

  // 캔버스 초기화를 큐의 맨 앞에 넣기
  const clear = new Shape({
    clearRect: { x: 0, y: 0, width: cvsWidth, height: cvsHeight },
  });

  drawQueue.push(clear);

  // 점들을 Shape 객체로 만들고 큐에 등록
  for (const curDot of dots) {
    const { x, y, radius, startAngle, endAngle, active } = curDot;

    const dotShape = new Shape({
      arc: {
        x,
        y,
        radius,
        startAngle,
        endAngle,
      },
      fillStyle: active ? NEAR_DOT_COLOR : DOT_COLOR,
    });

    drawQueue.push(dotShape);
  }

  // 큐 실행
  while (drawQueue.length > 0) {
    const shape = drawQueue.shift();
    shape?.draw();
  }
};
```

<br />

## **7. requestAnimationFrame**

이제 업데이트 함수와 그리기 함수를 `requestAnimationFrame` 에 등록하여 브라우저의 렌더링 프레임마다 실행할 수 있도록 한다.

```ts
const ANIMATION_FRAME_ID = useRef<null | number>(null);

const updateAndDraw = useCallback(() => {
  ANIMATION_FRAME_ID.current = requestAnimationFrame(() => {
    updateDots({
      dotsSetter: setDots,
      mousePos,
      env: ENV,
    });
    draw({
      mousePos,
      cvsSize,
      env: ENV,
      Shape: shape,
      areas,
      dots,
    });

    updateAndDraw();
  });
}, [ENV, shape, areas, cvsSize, dots, draw, mousePos, updateDots]);

useEffect(() => {
  if (!isReady) return;

  updateAndDraw();

  return () => {
    ANIMATION_FRAME_ID.current &&
      cancelAnimationFrame(ANIMATION_FRAME_ID.current);
  };
}, [updateAndDraw, isReady]);
```

<br />
<br />

# **Huggy Wuggy**

![](https://velog.velcdn.com/images/drrobot409/post/d59bd519-0b00-4af9-a9d0-1fffff84f55d/image.png)

두 번째 아이디어는 첫 번째 아이디어를 구현하던 도중 떠오른 아이디어이다.

캔버스에 찍어둔 점들을 고정 좌표로 활용하고, 네 개의 점(손발)을 마우스와 인접한 고정 좌표로 이동시켜 마치 팔다리가 움직이는 것 같은 애니메이션을 구현하는 아이디어이다. 그리고 그 위에 캐릭터의 모습을 덧씌워 캐릭터가 벽을 타고 이동하는 모습을 연출해 보았다.

첫 번째 아이디어도 충분히 다리가 움직이는 느낌을 줄 수 있지만 다리의 위치가 휙휙 변하고 다리의 개수가 인접한 점의 수에 따라 마구 변한다. 하지만 두 번째 아이디어는 다리 개수를 고정할 수 있고 부드러운 움직임을 구현할 수 있다.

코드 기반은 첫 번째 아이디어와 거의 동일하며, 다른 점 몇 가지를 아래에서 설명한다.

<br/>

## **1. 고정 좌표점 생성**

영역을 구분하고 랜덤 위치에 점을 생성하는 등의 내용은 첫 번째 아이디어와 동일하지만, 각 점에 id를 부여하고 배열 대신 객체에 점 데이터를 저장한다는 차이점이 있다.

그 이유는 이후 각 점을 사분면으로 구분하고 거리순으로 정렬했을 때 id를 통해 점의 데이터를 빠르게 불러오기 위함이다.

```ts
const dots: Dots = {};

// 각 영역당 하나씩 랜덤의 위치에 점 생성
for (const area of areas) {
  const { startX, endX, startY, endY } = area;
  const x = Math.floor(Math.random() * (endX - startX) + startX);
  const y = Math.floor(Math.random() * (endY - startY) + startY);

  const dot = {
    x,
    y,
    radius: 5,
    startAngle: 0,
    endAngle: Math.PI * 2,
    color: ENV.DOT_COLOR,
    active: false,
  };

  dots[generateId()] = dot;
}

setDots(dots);
```

<br/>

## **2. 손발 위치 업데이트**

이번 프로젝트에서는 모든 점이 움직이지 않고 4개의 손발만 움직이도록 한다.

각 손발은 자신이 해당하는 사분면에서, 가장 마우스와 가까운 고정점의 위치로 이동하게 된다.

따라서 각 고정점의 거리와 사분면을 계산하고 이후 손발의 위치를 계산하는 코드를 작성해야 한다.

### **2-1. 거리 계산 및 사분면 구분**

_(아래와 같이 마우스를 기준으로 사분면을 나눈다.)_
![](https://velog.velcdn.com/images/drrobot409/post/88d6ac21-086b-4827-b2cf-d64243261b03/image.png)

마우스의 위치를 기준으로 사분면을 나누고 각 점과 마우스 사이의 거리를 계산한다.

점의 위치를 사분면으로 나누는 이유는 각 손발의 이동 영역을 각 사분면으로 제한하여 팔다리가 꼬여있지 않은 자연스러운 자세를 유지하기 위함이다.

_오른손 -> 제 1 사분면에서만 움직임_
_왼손 -> 제 2 사분면에서만 움직임_
_왼발 -> 제 3 사분면에서만 움직임_
_오른발 -> 제 4 사분면에서만 움직임_

```ts
// 각 점과 그 거리를 사분면으로 구분하여 저장할 배열
const quadrant1: Array<DotDistance> = [],
  quadrant2: Array<DotDistance> = [],
  quadrant3: Array<DotDistance> = [],
  quadrant4: Array<DotDistance> = [];

// 각 점의 마우스와 거리 계산 후 사분면으로 나눠서 저장
for (const [id, dot] of Object.entries(dots)) {
  const { x: dotX, y: dotY } = dot;

  const distanceX = mouseX - dotX;
  const distanceY = mouseY - dotY;
  const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
  const dotDistance = { id, distance };

  if (dotX <= mouseX) {
    if (dotY <= mouseY) {
      quadrant2.push(dotDistance);
    } else {
      quadrant3.push(dotDistance);
    }
  } else {
    if (dotY <= mouseY) {
      quadrant1.push(dotDistance);
    } else {
      quadrant4.push(dotDistance);
    }
  }
}
```

<br/>

### **2-2. 거리순 정렬**

_(아래와 같이 각 사분면에서 마우스와 가장 가까운 점을 구한다.)_
![](https://velog.velcdn.com/images/drrobot409/post/f3400112-2070-453a-ac77-316528d6e54f/image.png)

이제 각 사분면의 점들을 마우스와 거리가 가까운 순으로 정렬하고, 사분면별로 가장 가까운 점을 구한다.

```ts
// 점들을 distance 오름차순으로 병합 정렬하는 함수
const dotSort = (
  dots: Array<{ id: string; distance: number }>
): Array<{ id: string; distance: number }> => {
  if (dots.length < 2) return dots;

  const center = Math.round(dots.length / 2),
    left = dotSort(dots.slice(0, center)),
    right = dotSort(dots.slice(center)),
    merged: Array<{ id: string; distance: number }> = [];

  let indexL = 0,
    indexR = 0;

  while (indexL < left.length && indexR < right.length) {
    const distanceL = left[indexL].distance,
      distanceR = right[indexR].distance;

    if (distanceL <= distanceR) {
      merged.push(left[indexL]);
      indexL += 1;
    } else {
      merged.push(right[indexR]);
      indexR += 1;
    }
  }

  return merged.concat(left.slice(indexL), right.slice(indexR));
};

// 각 사분면의 점들을 마우스 거리 가까운 순으로 정렬
const sortedQuadrant1 = dotSort(quadrant1),
  sortedQuadrant2 = dotSort(quadrant2),
  sortedQuadrant3 = dotSort(quadrant3),
  sortedQuadrant4 = dotSort(quadrant4);

// 각 사분면에서 가장 가까운 점들을 구한다.
// 없을 경우 인근 사분면에서 빌려옴.
const nearDot1 = sortedQuadrant1[0]?.id || sortedQuadrant3[1]?.id,
  nearDot2 = sortedQuadrant2[0]?.id || sortedQuadrant4[1]?.id,
  nearDot3 = sortedQuadrant3[0]?.id || sortedQuadrant1[1]?.id,
  nearDot4 = sortedQuadrant4[0]?.id || sortedQuadrant2[1]?.id,
  nearDots: NearDots = [nearDot1, nearDot2, nearDot3, nearDot4];

setNearDots(nearDots);
```

<br />

### **2-3. 손발 위치 계산**

각 손발(이하 `feet`)이 해당하는 사분면의 가장 가까운 고정 좌표로 이동하도록 위치를 업데이트한다.

```ts
// feet[0] -> 제1사분면 -> 오른손
// feet[1] -> 제2사분면 -> 왼손
// feet[2] -> 제3사분면 -> 왼발
// feet[3] -> 제4사분면 -> 오른발
setFeet((prev) => {
  let newFeet: Feet = prev;

  if (
    !prev &&
    (!dots[nearDot1]) ||
      !dots[nearDot2] ||
      !dots[nearDot3] ||
      !dots[nearDot4])
  )
    return null;

  // 이전 feet이 없을 경우 새로 할당
  newFeet ??= [
    dots[nearDot1],
    dots[nearDot2],
    dots[nearDot3],
    dots[nearDot4],
  ];

  for (let i = 0; i < newFeet.length; i++) {
    const foot = newFeet[i];
    const nearDot = nearDots[i];

    if (!nearDot) continue;

    const { x: footX, y: footY } = foot;
    const { x: targetX, y: targetY } = dots[nearDot];
    let x, y: number;

    const deltaX = targetX - footX; // 현재 x와 타겟 x의 거리
    const deltaY = targetY - footY; // 현재 y와 타겟 y의 거리
    // 현재 점과 타겟 점 사이의 거리(유클리드 거리 공식)
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    const SPEED = Math.round(distance / 10);

    // 현재 속도가 0보다 클 경우
    // 속력을 계산해 위치를 업데이트한다.
    if (SPEED > 0) {
      // 핸재 점(foot[x, y])에서 타겟 점(nearDot[x, y])을 바라보는 라디안 각도
      const angle = Math.atan2(deltaY, deltaX);
      // 속도와 각도를 통해 각 방향의 속력 구하기
      const velocityX = SPEED * Math.cos(angle);
      const velocityY = SPEED * Math.sin(angle);
      // 새로운 x,y 좌표 계산
      x = footX + velocityX;
      y = footY + velocityY;
      // 현재 속도가 0보다 작거나 같을 경우
      // 타겟 위치로 바로 이동한다.
    } else {
      x = targetX;
      y = targetY;
    }

    newFeet[i] = {
      ...newFeet[i],
      x,
      y,
    };
  }

  return newFeet;
});
```

<br />

### **2-4. 하나의 함수로 합치기**

```ts
const updateFeet = ({
  mousePos,
  dots,
  nearDotSetter,
  feetSetter,
  sortFx,
}: {
  mousePos: [number, number];
  dots: Dots;
  nearDotSetter: Dispatch<SetStateAction<NearDots>>;
  feetSetter: Dispatch<SetStateAction<Feet>>;
  sortFx: (
    dots: Array<{
      id: string;
      distance: number;
    }>
  ) => Array<{
    id: string;
    distance: number;
  }>;
}) => {
  const [mouseX, mouseY] = mousePos;

  const quadrant1: Array<DotDistance> = [],
    quadrant2: Array<DotDistance> = [],
    quadrant3: Array<DotDistance> = [],
    quadrant4: Array<DotDistance> = [];

  // 각 점의 마우스와 거리 계산 후 사분면으로 나눠서 저장
  for (const [id, dot] of Object.entries(dots)) {
    const { x: dotX, y: dotY } = dot;

    const distanceX = mouseX - dotX;
    const distanceY = mouseY - dotY;
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
    const dotDistance = { id, distance };

    if (dotX <= mouseX) {
      if (dotY <= mouseY) {
        quadrant2.push(dotDistance);
      } else {
        quadrant3.push(dotDistance);
      }
    } else {
      if (dotY <= mouseY) {
        quadrant1.push(dotDistance);
      } else {
        quadrant4.push(dotDistance);
      }
    }
  }

  // 각 사분면의 점들을 마우스 거리 가까운 순으로 정렬
  const sortedQuadrant1 = sortFx(quadrant1),
    sortedQuadrant2 = sortFx(quadrant2),
    sortedQuadrant3 = sortFx(quadrant3),
    sortedQuadrant4 = sortFx(quadrant4);

  const nearDot1 = sortedQuadrant1[0]?.id || sortedQuadrant3[1]?.id,
    nearDot2 = sortedQuadrant2[0]?.id || sortedQuadrant4[1]?.id,
    nearDot3 = sortedQuadrant3[0]?.id || sortedQuadrant1[1]?.id,
    nearDot4 = sortedQuadrant4[0]?.id || sortedQuadrant2[1]?.id,
    nearDots: NearDots = [nearDot1, nearDot2, nearDot3, nearDot4];

  nearDotSetter(nearDots);

  // feet[0] -> 제1사분면 -> 오른손
  // feet[1] -> 제2사분면 -> 왼손
  // feet[2] -> 제3사분면 -> 왼발
  // feet[3] -> 제4사분면 -> 오른발
  feetSetter((prev) => {
    let newFeet: Feet = prev;

    if (
      !prev &&
      (!dots[nearDot1] || !dots[nearDot2] || !dots[nearDot3] || !dots[nearDot4])
    )
      return null;

    newFeet ??= [
      dots[nearDot1],
      dots[nearDot2],
      dots[nearDot3],
      dots[nearDot4],
    ];

    for (let i = 0; i < newFeet.length; i++) {
      const foot = newFeet[i];
      const nearDot = nearDots[i];

      if (!nearDot) continue;

      const { x: footX, y: footY } = foot;
      const { x: targetX, y: targetY } = dots[nearDot];
      let x, y: number;

      const deltaX = targetX - footX; // 현재 x와 타겟 x의 거리
      const deltaY = targetY - footY; // 현재 y와 타겟 y의 거리
      // 현재 점과 타겟 점 사이의 거리(유클리드 거리 공식)
      const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
      const SPEED = Math.round(distance / 10);

      // 현재 속도가 0보다 클 경우
      // 속력을 계산해 위치를 업데이트한다.
      if (SPEED > 0) {
        // 현재 점(foot[x, y])에서 타겟 점(nearDot[x, y])을 바라보는 라디안 각도
        const angle = Math.atan2(deltaY, deltaX);
        // 속도와 각도를 통해 각 방향의 속력 구하기
        const velocityX = SPEED * Math.cos(angle);
        const velocityY = SPEED * Math.sin(angle);
        // 새로운 x,y 좌표 계산
        x = footX + velocityX;
        y = footY + velocityY;
        // 현재 속도가 0보다 작거나 같을 경우
        // 타겟 위치로 바로 이동한다.
      } else {
        x = targetX;
        y = targetY;
      }

      newFeet[i] = {
        ...newFeet[i],
        x,
        y,
      };
    }

    return newFeet;
  });
};
```

<br />

## **3. 그리기**

이제 손발과 캐릭터의 모습을 캔버스에 그리면 된다.
추가로 `radialGradient` 를 활용해 스포트라이트 효과를 넣어 보았다.

캐릭터의 팔다리와 몸통은 캔버스의 `stroke` 와 `ellipse`, `quadraticCurve` 등을 이용하였고 머리는 참고 이미지를 바탕으로 일러스트레이터에서 직접 그린 svg를 `drawImage` 를 이용해 캔버스에 그렸다.

배경 이미지는 일러스트레이터에서 제작하여 css로 삽입하였다.

```ts
const draw = ({
  mousePos,
  cvsSize,
  Shape,
  feet,
  dots,
  nearDots,
  env,
}: {
  mousePos: [number, number];
  cvsSize: [number, number];
  Shape: typeof shape;
  feet: Feet;
  dots: Dots;
  nearDots: NearDots;
  env: ENV;
}) => {
  const { LINE_COLOR, LIMBS_WIDTH, BODY_COLOR, BODY_HEIGHT, BODY_WIDTH, FACE } =
    env;
  const [mouseX, mouseY] = mousePos;
  const [cvsWidth, cvsHeight] = cvsSize;

  // draw를 순차적으로 실행할 덱
  // Shape 객체를 담는다.
  const drawDeque: Array<InstanceType<typeof Shape>> = [];

  // 팔다리
  if (!!feet) {
    for (let i = 0; i < feet.length; i++) {
      const { x, y } = feet[i];
      let jointX = mouseX;
      let jointY = mouseY;
      let controlX = (x + jointX) / 2 + 10;
      let controlY = (y + jointY) / 2;

      // 오른팔
      if (i === 0) {
        // 팔
        jointX += BODY_WIDTH / 2 - LIMBS_WIDTH / 2;
        jointY -= BODY_HEIGHT / 2;
        controlY += 20;

        // 손
        const palm = new Shape({
          ellipse: {
            x,
            y: y - LIMBS_WIDTH / 4,
            radiusX: LIMBS_WIDTH * 0.5,
            radiusY: LIMBS_WIDTH * 0.8,
            rotation: (Math.PI / 180) * 20,
            startAngle: 0,
            endAngle: Math.PI * 2,
          },
          fillStyle: "yellow",
        });
        const thumb = new Shape({
          ellipse: {
            x: x - LIMBS_WIDTH / 2,
            y: y - LIMBS_WIDTH / 4,
            radiusX: LIMBS_WIDTH * 0.4,
            radiusY: LIMBS_WIDTH * 0.2,
            rotation: (Math.PI / 180) * 45,
            startAngle: 0,
            endAngle: Math.PI * 2,
          },
          fillStyle: "yellow",
        });

        drawDeque.unshift(palm, thumb);

        // 왼팔
      } else if (i === 1) {
        // 팔
        jointX -= BODY_WIDTH / 2 - LIMBS_WIDTH / 2;
        jointY -= BODY_HEIGHT / 2;
        controlY += 20;

        // 손
        const palm = new Shape({
          ellipse: {
            x,
            y: y - LIMBS_WIDTH / 4,
            radiusX: LIMBS_WIDTH * 0.5,
            radiusY: LIMBS_WIDTH * 0.8,
            rotation: (Math.PI / 180) * 340,
            startAngle: 0,
            endAngle: Math.PI * 2,
          },
          fillStyle: "yellow",
        });
        const thumb = new Shape({
          ellipse: {
            x: x + LIMBS_WIDTH / 2,
            y: y - LIMBS_WIDTH / 4,
            radiusX: LIMBS_WIDTH * 0.4,
            radiusY: LIMBS_WIDTH * 0.2,
            rotation: (Math.PI / 180) * 135,
            startAngle: 0,
            endAngle: Math.PI * 2,
          },
          fillStyle: "yellow",
        });

        drawDeque.unshift(palm, thumb);

        // 다리
      } else {
        // 왼다리
        if (i === 2) {
          jointX -= BODY_WIDTH / 2 - LIMBS_WIDTH / 2;
          jointY += BODY_HEIGHT / 2 - LIMBS_WIDTH / 2;
          controlY -= 20;
          // 오른 다리
        } else {
          jointX += BODY_WIDTH / 2 - LIMBS_WIDTH / 2;
          jointY += BODY_HEIGHT / 2 - LIMBS_WIDTH / 2;
          controlY -= 20;
        }

        // 발
        const foot = new Shape({
          ellipse: {
            x,
            y: y - LIMBS_WIDTH / 5,
            radiusX: LIMBS_WIDTH * 0.6,
            radiusY: LIMBS_WIDTH * 0.8,
            rotation: 0,
            startAngle: 0,
            endAngle: Math.PI * 2,
          },
          fillStyle: "yellow",
        });

        drawDeque.unshift(foot);
      }

      const limb = new Shape({
        quadraticCurve: {
          moveTo: { x, y },
          quadraticCurveTo: {
            cpx: controlX,
            cpy: controlY,
            x: jointX,
            y: jointY,
          },
        },
        strokeStyle: BODY_COLOR,
        lineWidth: LIMBS_WIDTH,
      });

      drawDeque.push(limb);
    }
  }

  // 바디
  const body = new Shape({
    fillRect: {
      x: mouseX - BODY_WIDTH / 2,
      y: mouseY - BODY_HEIGHT / 2,
      width: BODY_WIDTH,
      height: BODY_HEIGHT - BODY_HEIGHT / 5,
    },
    fillStyle: BODY_COLOR,
  });
  const shoulder = new Shape({
    arc: {
      x: mouseX,
      y: mouseY - BODY_HEIGHT / 2,
      radius: BODY_WIDTH / 2,
      startAngle: Math.PI,
      endAngle: Math.PI * 2,
    },
    fillStyle: BODY_COLOR,
  });
  const ass = new Shape({
    arc: {
      x: mouseX,
      y: mouseY + BODY_HEIGHT / 2 - BODY_HEIGHT / 5,
      radius: BODY_WIDTH / 2,
      startAngle: Math.PI * 2,
      endAngle: Math.PI * 3,
    },
    fillStyle: BODY_COLOR,
  });

  // 머리
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(FACE);
  const head = new Shape({
    drawImage: {
      image: img,
      x: mouseX - BODY_WIDTH * 1.5,
      y: mouseY - BODY_HEIGHT * 1.5,
      width: BODY_WIDTH * 3,
      height: BODY_WIDTH * 3,
    },
  });

  // spotlight
  const spotlight = new Shape({
    radialGradient: {
      x0: mouseX,
      y0: mouseY,
      r0: 0,
      x1: mouseX,
      y1: mouseY,
      r1: Math.max(...cvsSize) * 1.5,
    },
    colorStops: [
      [0.01, "rgba(200, 255, 255, 0)"],
      [0.03, "rgba(49, 63, 62, 0)"],
      [0.06, "rgba(33, 33, 33, 0.5)"],
      [0.08, "rgba(33, 33, 33, 0.8)"],
      [0.1, "rgba(33, 33, 33, 0.9)"],
      [0.15, "rgba(33, 33, 33, 1)"],
    ],
    arc: {
      x: mouseX,
      y: mouseY,
      radius: Math.max(...cvsSize) * 2,
      startAngle: Math.PI * 2,
      endAngle: 0,
    },
  });

  drawDeque.push(body, shoulder, ass, head, spotlight);

  const clear = new Shape({
    clearRect: { x: 0, y: 0, width: cvsWidth, height: cvsHeight },
  });

  drawDeque.unshift(clear);

  // 덱 실행
  while (drawDeque.length > 0) {
    const shape = drawDeque.shift();
    shape?.draw();
  }
};
```
