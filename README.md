# **JS Canvas API**

![](https://velog.velcdn.com/images/drrobot409/post/287886e2-29d5-463c-b796-8f9aa105d662/image.png)
지금까지 공부 해오면서 Three나 Matter 등의 라이브러리를 활용한 canvas는 아주 살짝 맛을 본 적이 있지만 JS의 기본 Canvas API는 사용해 본 적이 없다.

따라서 간단한 아이디어를 구현하며 Canvas API의 기본 사용법에 대해 익혀보기로 하였다.

구현한 아이디어는 총 두 개로, 하나는 원래 계획에 없었으나 첫 번째 아이디어 구현 중 떠올라서 추가하였다.

프로젝트는 React 환경에서 진행하였다.

<br />

---

<br />

# **Dots**

![](https://velog.velcdn.com/images/drrobot409/post/beeae371-a343-4957-ad58-2b5742955d6d/image.png)

캔버스에 여러 점들을 찍어두고 마우스의 움직임에 따라 마우스와 인접한 점들이 따라 움직이는 아이디어를 구현해 보았다.

흔하게 볼 수 있는 아이디어지만 첫 Canvas API 사용인 만큼 간단하게 구현할 수 있는 아이디어로 선정하였다.

<br />

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

이 상태는 이후 캔버스에 사이즈를 지정하고 참조할 때 사용한다.

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

무차별 랜덤으로 점을 분포할 경우 무수히 많은 점을 찍으면 결국엔 평균 회귀로 고르게 점이 찍히겠지만, 여기서는 점을 그렇게 많이 찍지 않기 때문에 캔버스에 점을 고르게 분포하기 위해 캔버스의 영역을 균일하게 나누고 각 영역당 하나의 점만 생성하는 방식을 사용하였다.

### **3-1. 영역 구분**

캔버스와 컨텍스트가 준비되면 캔버스의 사이즈를 지정하고 캔버스를 지정된 개수에 맞게 영역을 나눈다.

아래 사진은 구분된 영역을 가시화하여 캔버스에 나타낸 참고용 스크린샷이다.

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

아래 사진은 구분된 영역과 생성한 점을 가시화하여 캔버스에 나타낸 참고용 스크린샷이다.

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

이 함수는 앞서 등록한 컨테이너 리사이즈 옵저버에서 호출하여 최초 로드와 리사이즈시 영역과 점을 생성하도록 한다.

```ts
const resizeObserver = useMemo(
  () =>
    new ResizeObserver(
      _.debounce((entries) => {
        for (const entry of entries) {
          const { inlineSize: width, blockSize: height } =
            entry.borderBoxSize[0];
          setCvsSize([width, height]);
          createDots(width, height); // 바로 여기
        }
      }, 100)
    ),
  [createDots]
);
```

<br />

## **4. 점 위치 업데이트**

마우스와 각 점 사이의 거리를 계산하고 그에 따라 점의 위치를 업데이트하는 함수를 작성한다.

점의 이동 속도는 목표와의 거리가 가까울수록 낮아지며, 거기에 감쇠 계수를 적용하여 속도의 변화가 더 완만하도록 하였다. 이 속도는 프레임을 거듭할수록 점점 작아지며 0에 수렴하게 되지만 절대 0이 되지는 않기 때문에 일정 값 이하로 내려갈 경우 속도를 0으로 고정하여 무수히 많은 소수점 연산이 계속되는 것을 방지하였다.

또한 현재 위치와 목표 위치 사이의 각도를 구하고 삼각함수를 활용해 속도를 각 축의 속력으로 계산하여 점이 목표 위치를 향해 직선으로 이동할 수 있도록 하였다.

```tsx
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
    const { MOUSE_RANGE } = env;
    const newDots: Array<Dot> = [];

    for (const dot of prev) {
      // 마우스와 점 사이의 거리를 계산, 거리가 MOUSE_RANGE 이하일 경우 active
      const { x: dotX, originX, y: dotY, originY } = dot;
      const mouseDeltaX = mouseX - originX;
      const mouseDeltaY = mouseY - originY;
      const mouseDistance = Math.sqrt(mouseDeltaX ** 2 + mouseDeltaY ** 2);
      const active = mouseDistance <= MOUSE_RANGE ? true : false;
      let x, y, targetX, targetY: number;

      // active 여부에 따라 목표 지점을 결정
      if (active) {
        targetX = mouseX - mouseDeltaX * 0.6;
        targetY = mouseY - mouseDeltaY * 0.6;
      } else {
        targetX = originX;
        targetY = originY;
      }

      const deltaX = targetX - dotX; // 현재 x와 타겟 x의 거리
      const deltaY = targetY - dotY; // 현재 y와 타겟 y의 거리
      // 현재 점과 타겟 사이의 거리(유클리드 거리 공식)
      const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

      const dampingFactor = 0.5; // 감쇠 계수
      const curSpeed = distance / (active ? 10 : 30); // 남은 거리와 활성화 여부에 따라 속도 계산
      const SPEED = curSpeed < 0.01 ? 0 : curSpeed * dampingFactor; // 감쇠 계수를 적용한 속도

      // 속도가 0보다 클 경우
      // 속력을 계산해 위치를 업데이트한다.
      if (SPEED > 0) {
        // 현재 점에서 타겟을 바라보는 라디안 각도
        const angle = Math.atan2(deltaY, deltaX);
        // 속도와 각도를 통해 각 방향의 속력 구하기
        const velocityX = SPEED * Math.cos(angle);
        const velocityY = SPEED * Math.sin(angle);
        // 새로운 x,y 좌표 계산
        x = dotX + velocityX;
        y = dotY + velocityY;
        // 속다가 0보다 작을 경우
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

## **5. 그리기**

이제 위의 계산을 바탕으로 캔버스에 점을 그린다.

```tsx
const draw = ({
  cvsSize,
  env,
  dots,
  ctx,
}: {
  cvsSize: [number, number];
  env: ENV;
  dots: Array<Dot>;
  ctx: CanvasRenderingContext2D;
}) => {
  const { NEAR_DOT_COLOR, DOT_COLOR } = env;
  const [cvsWidth, cvsHeight] = cvsSize;

  // 그리기 명령 배열
  const drawCommands: Array<(ctx: CanvasRenderingContext2D) => void> = [];

  for (const curDot of dots) {
    const { x, y, radius, startAngle, endAngle, active } = curDot;

    drawCommands.push((ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = active ? NEAR_DOT_COLOR : DOT_COLOR;
      ctx.beginPath();
      ctx.arc(x, y, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();
    });
  }

  // 캔버스 전체 지우기 및 설정
  drawCommands.unshift((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, cvsWidth, cvsHeight);
  });

  // 모든 그리기 명령 실행
  for (let i = 0; i < drawCommands.length; i++) {
    const command = drawCommands[i];
    command(ctx);
  }
};
```

<br />

## **6. requestAnimationFrame**

마지막으로 업데이트 함수와 그리기 함수를 `requestAnimationFrame` 에 등록하여 브라우저의 렌더링 프레임마다 실행할 수 있도록 한다.

추가로 좀 더 다양한 시각적 정보를 위해 디버그 모드를 만들고 디버그용 그리기 함수를 별도로 작성하였다.

디버그 모드의 그리기 함수는 [여기(Github)](https://github.com/RAREBEEF/interactive/blob/master/src/pages/Dots.tsx#L316-L404)에서 확인할 수 있다.

```ts
const ANIMATION_FRAME_ID = useRef<null | number>(null);

const updateAndDraw = useCallback(() => {
  ANIMATION_FRAME_ID.current = requestAnimationFrame(() => {
    updateDots({
      dotsSetter: setDots,
      mousePos,
      env: ENV,
    });
    isDebug
      ? debug({
          cvsSize,
          mousePos,
          areas,
          env: ENV,
          dots,
          ctx: ctx as CanvasRenderingContext2D,
          offscreenCtx: offscreenCtx as CanvasRenderingContext2D,
          offscreenCvs: offscreenCvs as HTMLCanvasElement,
        })
      : draw({
          cvsSize,
          env: ENV,
          dots,
          ctx: ctx as CanvasRenderingContext2D,
          offscreenCtx: offscreenCtx as CanvasRenderingContext2D,
          offscreenCvs: offscreenCvs as HTMLCanvasElement,
        });

    updateAndDraw();
  });
}, [
  updateDots,
  mousePos,
  ENV,
  isDebug,
  debug,
  cvsSize,
  areas,
  dots,
  ctx,
  offscreenCtx,
  offscreenCvs,
  draw,
]);

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

완성된 모습은 아래와 같고 [여기](https://interactive-one.vercel.app/dots)에서 직접 확인해 볼 수 있다.
![](https://velog.velcdn.com/images/drrobot409/post/beeae371-a343-4957-ad58-2b5742955d6d/image.png)

<br />

---

<br />

# **Huggy Wuggy**

![](https://velog.velcdn.com/images/drrobot409/post/683e8034-c66a-4079-804a-eac2510c5d0c/image.png)

두 번째 아이디어는 첫 번째 아이디어를 구현하던 도중 떠오른 아이디어이다.

캔버스에 찍어둔 점들을 고정 좌표로 활용하고, 네 개의 점(손발)을 마우스와 인접한 고정 좌표로 이동시켜 마치 팔다리가 움직이는 것 같은 애니메이션을 구현하는 아이디어이다. 그리고 그 위에 캐릭터의 모습을 덧씌워 캐릭터가 벽을 타고 이동하는 모습을 연출해 보았다.

첫 번째 아이디어만으로도 충분히 다리가 움직이는 느낌을 줄 수 있지만 다리의 위치가 휙휙 변하고 다리의 개수가 인접한 점의 수에 따라 마구 변한다. 하지만 두 번째 아이디어는 다리 개수를 고정할 수 있고 부드러운 움직임을 구현할 수 있다.

코드 기반은 첫 번째 아이디어와 거의 동일하며, 다른 점 몇 가지를 아래에서 설명한다.

<br/>

## **1. 더블 버퍼링**

이번 아이디어에서는 몇 가지 이미지 파일이 사용되는데, 이미지가 캔버스에 그려지는 사이에 공백이 발생하여 깜빡이는 현상을 대폭 완화하기 위해 더블 버퍼링 방식을 사용하였다.

더블 버퍼링 방식은 화면에 직접 표시하지 않을 캔버스(`offscreenCanvas`)를 하나 생성하고 모든 요소를 해당 캔버스에 그린 후, 모든 그리기가 완료되면 출력할 캔버스에 offscreenCanvas의 내용을 덮어 씌우는 방식이다.

offscreenCanvas의 사이즈는 기존 캔버스의 사이즈와 동일하게 지정하고, 그 외 리사이즈 옵저버 등록과 초기화 등은 기존과 똑같이 진행하면 된다.

```tsx
// 컨테이너와 캔버스 체크 & 상태 저장
useEffect(() => {
  if (!containerRef.current || !cvsRef.current) return;
  setContainer(containerRef.current);
  setCvs(cvsRef.current);
  setCtx(cvsRef.current.getContext("2d"));
  const offscreenCanvas = document.createElement("canvas");
  const offscreenContext = offscreenCanvas.getContext("2d");
  setOffscreenCvs(offscreenCanvas);
  setOffscreenCtx(offscreenContext);
  document.body.style.cursor = "none";

  return () => {
    document.body.style.cursor = "auto";
  };
}, [containerRef, cvsRef]);
```

<br/>

## **2. 고정 좌표점 생성**

영역을 구분하고 랜덤 위치에 점을 생성하는 등의 내용은 첫 번째 아이디어와 동일하지만, 각 점에 id를 부여하고 배열 대신 객체에 점 데이터를 저장한다는 차이점이 있다.

이 차이는 이후 각 점을 사분면으로 구분하고 거리순으로 정렬한 후에도 id를 통해 점의 데이터를 빠르게 불러오기 위함이다.

~~또한 이 점들이 캐릭터가 손발로 붙잡을 위치란 것을 나타내기 위해 각 점의 위치에 [클라이밍 홀드](https://www.google.com/search?sca_esv=562665302&sxsrf=AB5stBiYgMvV3hy7o4h0mf6slKvXQlmIRg:1693893774673&q=%ED%81%B4%EB%9D%BC%EC%9D%B4%EB%B0%8D+%ED%99%80%EB%93%9C&tbm=isch&source=lnms&sa=X&ved=2ahUKEwjMweaF5pKBAxVPMN4KHWLoAQgQ0pQJegQIDRAB&biw=1130&bih=1115&dpr=2) 이미지를 그릴 예정이다.~~ 디자인이 구려서 완성본에서는 점으로 대체하였다.

```ts
const dots: Dots = {};

// 각 영역당 하나씩 랜덤의 위치에 점 생성
for (const area of areas) {
  const { startX, endX, startY, endY } = area;
  const x = Math.floor(Math.random() * (endX - startX) + startX);
  const y = Math.floor(Math.random() * (endY - startY) + startY);

  // 클라이밍 홀드 이미지(4개 이미지 중 랜덤) 부여
  // 완성본에서는 점으로 대체하였다.
  const image = new Image();
  const holdNum = Math.floor(Math.random() * 4) + 1;
  image.src = `/images/hold${holdNum}.png`;

  const dot = {
    x,
    y,
    image,
  };

  dots[generateId()] = dot;
}

setDots(dots);
```

<br/>

## **3. 몸통 및 손발 위치 업데이트**

이번 아이디어에서는 모든 점이 움직이는 것이 아닌 몸통과 4개의 점(손발)만 움직인다.

몸통과 활성화된 손은 마우스의 위치를 따라다니고(일정 거리 유지하며) 활성화되지 않은 손과 발은 자신이 해당하는 사분면에서 가장 몸통과 가까운 고정점의 위치로 이동하게 된다.

따라서 각 고정점의 거리와 사분면을 계산하고 그 이후에 손발의 위치를 계산해야 한다. 이런 계산을 통해 움직임을 구현하면 캐릭터가 벽면을 타고 다니며 마우스 포인터를 손으로 가리키는 모습을 만들 수 있다.

### **3-1. 몸통 위치 계산**

몸통은 기본적으로 마우스를 따라다니지만 마우스와의 거리가 기준보다 가까울 때는 움직이지 않으며 거리가 기준보다 멀어질 경우 다시 마우스에게 다가간다.

```tsx
// 몸통 위치 계산에 사용할 마우스 위치값
// 실제 마우스 위치보다 조금 아래로 잡아서 손을 아래보다 위로 더 뻗을 수 있도록 조절하기 위함
const mouseBodyX = mouseX;
const mouseBodyY = mouseY + BODY_HEIGHT;

bodySetter((prev) => {
  const [bodyX, bodyY] = prev;
  let newX = bodyX;
  let newY = bodyY;

  // 마우스와 몸통 사이의 거리
  const deltaX = mouseBodyX - bodyX;
  const deltaY = mouseBodyY - bodyY;
  // 몸통이 마우스의 정위치로 너무 따라다니지 않고 거리를 유지하며 움직일 수 있도록 거리에서 일정 값을 빼준다.
  const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2) - BODY_HEIGHT * 2;

  // 속도 계산
  const dampingFactor = 0.5; // 감쇠 계수
  const curSpeed = distance / 10; // 남은 거리에 기반하여 속도 계산
  const SPEED = curSpeed < 0.01 ? 0 : curSpeed * dampingFactor; // 감쇠 계수를 적용한 속도

  // 현재 속도가 0보다 클 경우
  // 속력을 계산해 위치를 업데이트한다.
  if (SPEED > 0) {
    // 현재 몸통 위치에서 목표 위치를 바라보는 라디안 각도
    const angle = Math.atan2(deltaY, deltaX);
    // 속도와 각도를 통해 각 방향의 속력 구하기
    const velocityX = SPEED * Math.cos(angle);
    const velocityY = SPEED * Math.sin(angle);
    // 새로운 x,y 좌표 계산
    newX += velocityX;
    newY += velocityY;
    // 현재 속도가 0보다 작거나 같을 경우
    // 움직이지 않는다.
  } else {
    return [bodyX, bodyY];
  }

  return [newX, newY];
});
```

<br />

### **3-2. 거리 계산 및 사분면 구분**

![](https://velog.velcdn.com/images/drrobot409/post/f5a6e44d-11c0-426f-aac0-89ea7308943d/image.png)

몸통 위치를 기준으로 사분면을 나누고 각 점과 몸통 사이의 거리를 계산한다.

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

// 각 점과 몸통 사이 거리 계산 후 사분면으로 나눠서 저장
for (const [id, dot] of Object.entries(dots)) {
  const { x: dotX, y: dotY } = dot;

  const deltaX = bodyX - dotX;
  const deltaY = bodyY - dotY;
  const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
  const dotDistance = { id, distance };

  if (dotX <= bodyX) {
    if (dotY <= bodyY) {
      quadrant2.push(dotDistance);
    } else {
      quadrant3.push(dotDistance);
    }
  } else {
    if (dotY <= bodyY) {
      quadrant1.push(dotDistance);
    } else {
      quadrant4.push(dotDistance);
    }
  }
}
```

<br/>

### **3-3. 거리순 정렬**

![](https://velog.velcdn.com/images/drrobot409/post/be0c141d-4cd0-42a6-b4d6-a8ae27670bae/image.png)

이제 각 사분면의 점들을 몸통과 거리가 가까운 순으로 정렬하고, 사분면별로 가장 가까운 점을 구한다.

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

// 각 사분면의 점들을 몸통과 가까운 순으로 정렬
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

### **3-4. 손발 위치 계산**

각 손발이 해당하는 사분면의 가장 가까운 고정 좌표로 이동하도록 위치를 업데이트한다.

단, 활성화된 손은 가까운 고정 좌표 대신 마우스 포인터의 위치를 쫓는다.

여기서 말하는 활성화된 손은 마우스가 몸통을 기준으로 우측에 있을 경우 오른손, 왼쪽에 있을 경우 왼손이다.

```tsx
feetSetter((prev) => {
  let newFeet: Feet = prev;

  if (
    !prev &&
    (!dots[nearDot1] || !dots[nearDot2] || !dots[nearDot3] || !dots[nearDot4])
  )
    return null;

  newFeet ??= [dots[nearDot1], dots[nearDot2], dots[nearDot3], dots[nearDot4]];

  for (let i = 0; i < newFeet.length; i++) {
    const foot = newFeet[i];
    const { x: footX, y: footY } = foot;
    const nearDot = nearDots[i];
    let targetX, targetY: number | null;

    // 활성화된 손은 마우스 위치를 따라가고 그 외는 인접한 점으로 이동
    const isTrackingMouse =
      (i === 0 && bodyX <= mouseBodyX) || (i === 1 && bodyX > mouseBodyX);
    // 손이 마우스의 정위치로 너무 따라다니지 않고 거리를 유지하며 움직일 수 있도록 계산한다..
    if (isTrackingMouse) {
      // 손의 x위치는 몸통에서 멀어질 수록 마우스와 더 멀어지고 가까워질수록 마우스와 더 가까워진다.
      targetX =
        mouseX +
        LIMBS_WIDTH *
          ((bodyX - mouseX - Math.sign(bodyX - mouseX) * LIMBS_WIDTH * 2) /
            (LIMBS_WIDTH * 4));
      // 손의 y위치는 마우스와 항상 일정한 거리를 유지한다.
      // 그래야 손가락으로 마우스 위치를 가리키는 것 처럼 보인다.
      targetY = mouseY + Math.sign(bodyY - mouseY) * LIMBS_WIDTH * 1.5;
    } else {
      targetX = dots[nearDot]?.x;
      targetY = dots[nearDot]?.y;
    }

    if (!targetX || !targetY) continue;

    let newX, newY: number;

    // 현재 점과 타겟 점 사이의 거리
    const deltaX = targetX - footX;
    const deltaY = targetY - footY;
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

    // 속도 계산
    const dampingFactor = 0.8; // 감쇠 계수
    const curSpeed = distance / 5; // 남은 거리에 기반하여 속도 계산
    const SPEED = curSpeed < 0.01 ? 0 : curSpeed * dampingFactor; // 감쇠 계수를 적용한 속도

    // 현재 속도가 0보다 클 경우
    // 속력을 계산해 위치를 업데이트한다.
    if (SPEED > 0) {
      // 현재 점(foot[x, y])에서 타겟 점(nearDot[x, y])을 바라보는 라디안 각도
      const angle = Math.atan2(deltaY, deltaX);
      // 속도와 각도를 통해 각 방향의 속력 구하기
      const velocityX = SPEED * Math.cos(angle);
      const velocityY = SPEED * Math.sin(angle);
      // 새로운 x,y 좌표 계산
      newX = footX + velocityX;
      newY = footY + velocityY;
      // 현재 속도가 0보다 작거나 같을 경우
      // 타겟 위치로 바로 이동한다.
    } else {
      newX = targetX;
      newY = targetY;
    }

    newFeet[i] = {
      ...newFeet[i],
      x: newX,
      y: newY,
      trackingMouse: isTrackingMouse,
    };
  }

  return newFeet;
});
```

<br />

### **3-5. 하나의 함수로 합치기**

위 내용을 하나의 함수로 합친다.  
내용이 너무 길어지기 때문에 코드 링크로 대체

[코드 링크 (Github)](https://github.com/RAREBEEF/interactive/blob/master/src/pages/HuggyWuggy.tsx#L229-L431)

<br />

## **4. 그리기**

위에서 계산한 손발의 위치를 바탕으로 캐릭터와 기타 요소들을 캔버스에 그린다.

캐릭터 머리와 클라이밍 홀드, 플래시라이트 등은 이미지를 그리는 방식을 사용하였고, 그 외 몸통 등은 캔버스에서 직접 그렸다.

캐릭터와 클라이밍 홀드를 그리는 내용은 별거 없기 때문에 생략하였고 플래시라이트와 활성화된 손을 그리는 부분과 더블 버퍼링을 실행하는 부분만 가져와 보았다.

### **4-1. 플래시라이트**

![](https://velog.velcdn.com/images/drrobot409/post/55a394f4-e811-4767-8758-e4f63df225df/image.png)

플래시라이트는 비추는 각도와 위치에 따라 비춰지는 면에 나타나는 형태가 변한다. 이러한 현상을 최대한 비슷하게 구현하여 실제 플래시라이트와 같은 느낌을 줄 수 있도록 해보았다.

```tsx
// 플래시라이트
// 실제 빛을 비추는 느낌을 주기 위해 비추는 위치 따라 사이즈와 각도를 변경
drawCommands.push((ctx: CanvasRenderingContext2D) => {
  const vmax = Math.max(...cvsSize);
  const img = new Image();
  img.src = `/images/flashlight.svg`;

  // 캔버스 중앙과 마우스x 사이 거리
  const deltaFromCenterX = cvsWidth / 2 - mouseX;
  // 캔버스 바닥과 마우스y 사이 거리
  const deltaFromBottomY = cvsHeight - mouseY;
  // // deltaFromBottomY 정규화
  const normalizedDeltaY = deltaFromBottomY / cvsHeight;

  // 플래시라이트 이미지 너비
  const width = vmax * 5;
  // 플래시라이트 이미지 높이, normalizedDeltaY에 따라 가변.
  const height = vmax * 5 + vmax * normalizedDeltaY * 5;
  // 각도 계산, deltaFromCenterX에 따라 가변.
  const angle =
    -Math.atan2(mouseY - cvsHeight * 1.5, deltaFromCenterX) +
    (-90 * Math.PI) / 180;

  // 계산한 각도로 컨텍스트 회전
  ctx.rotate(angle);

  // 회전된 좌표계 내에서 마우스 위치 계산
  const rotatedMouseX = mouseX * Math.cos(angle) + mouseY * Math.sin(angle);
  const rotatedMouseY = -mouseX * Math.sin(angle) + mouseY * Math.cos(angle);

  ctx.drawImage(
    img,
    rotatedMouseX - width / 2,
    rotatedMouseY - height / 2,
    width,
    height
  );

  ctx.setTransform(1, 0, 0, 1, 0, 0);
});
```

<br />

### **4-2. 마우스를 가리키는 손**

![](https://velog.velcdn.com/images/drrobot409/post/a9cafcba-1115-4971-8918-f0a4cfee75aa/image.png)

마우스를 가리키는 손은 마우스 포인터의 위치를 따라다니지만 손가락 끝으로 마우스 포인터를 가리키는(혹은 클릭하는) 느낌을 주기 위해 의도적으로 거리를 벌려두었다.

여기서 손가락이 포인터의 위치를 자연스럽게 향하기 위해서는 손과 포인터 사이의 각도를 계산하고 손 모양 이미지를 계산한 각도만큼 회전하도록 해야 한다.

```tsx
const { x, y, trackingMouse } = feet[i];
const deltaX = x - mouseX;
const deltaY = y - mouseY;
const angle = -Math.atan2(deltaX, deltaY);

if (trackingMouse) {
  const img = new Image();
  img.src = `/images/huggy_wuggy_finger.svg`;

  drawCommands3.unshift((ctx: CanvasRenderingContext2D) => {
    // 계산한 각도로 컨텍스트 회전
    ctx.rotate(angle);

    // 회전된 좌표계 내에서 손 위치 계산
    const rotatedRHandX = x * Math.cos(angle) + y * Math.sin(angle);
    const rotatedRHandY = -x * Math.sin(angle) + y * Math.cos(angle);

    ctx.drawImage(
      img,
      rotatedRHandX - LIMBS_WIDTH,
      rotatedRHandY - LIMBS_WIDTH * 1.5,
      LIMBS_WIDTH * 2,
      LIMBS_WIDTH * 2
    );

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });
}
```

<br />

### **4-3. 더블 버퍼링**

```tsx
// 모든 그리기 명령 실행
for (let i = 0; i < drawCommands.length; i++) {
  const command = drawCommands[i];
  command(offscreenCtx);
}

// 더블 버퍼링
ctx.clearRect(0, 0, ...cvsSize);
ctx.drawImage(offscreenCvs!, 0, 0);
```

<br />

![](https://velog.velcdn.com/images/drrobot409/post/287886e2-29d5-463c-b796-8f9aa105d662/image.png)

앞서 설명한 코드대로 구현한 원래 모습은 위 이미지와 같지만 디자인이 너무 구려서 클라이밍 홀드와 배경 이미지를 단순화하였다. 좋은 디자인 아이디어가 떠오르면 적용해 볼 예정이다.

[여기](https://interactive-one.vercel.app/huggywuggy)에서 직접 확인해 볼 수 있으며 [포트폴리오](https://www.rarebeef.co.kr/projects/huggywuggy)에는 플래시라이트를 없애고 허기워기의 그림자를 추가하는 등 몇가지 변경 사항이 업데이트된 버전을 추가하였다.

<br />

---

<br />

해보기 전까지는 여러가지 drawing function 때문에 복잡하고 어려워 보였는데 직접 해보니 캔버스 api 자체는 별거 없었지만 이것 저것 계산할 것이 많았다. 구현 과정도 재밌었고 완성 후의 성취감도 좋았기에 더 재밌는 아이디어가 떠오른다면 또 만들어 볼 예정이다.
