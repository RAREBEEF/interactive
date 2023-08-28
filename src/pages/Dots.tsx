import {
  Dispatch,
  MouseEvent,
  SetStateAction,
  TouchEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./Dots.module.scss";
import _ from "lodash";
import useShape from "../hooks/useShape";

interface ENV {
  SPEED: number;
  AREA_DIVIDE: number;
  AREA_GAP: number;
  DOT_COLOR: string;
  LINE_COLOR: string;
  NEAR_DOT_COLOR: string;
  MOUSE_RANGE: number;
}

interface Dot {
  x: number;
  y: number;
  originX: number;
  originY: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  active: boolean;
}

interface Area {
  startX: number;
  endX: number;
  startY: number;
  endY: number;
  width: number;
  height: number;
}

const Dots = () => {
  const cvsRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [cvs, setCvs] = useState<HTMLCanvasElement | null>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [areas, setAreas] = useState<Array<Area>>([]);
  const [dots, setDots] = useState<Array<Dot>>([]);
  const [cvsSize, setCvsSize] = useState<[number, number]>([0, 0]);
  const [mousePos, setMousePos] = useState<[number, number]>([0, 0]);
  const shape = useShape(ctx);
  const isReady = useMemo(
    () => !!cvs && !!ctx && !!container,
    [cvs, ctx, container]
  );
  const ENV = useMemo(() => {
    const areaDivide = 20;
    return {
      SPEED: 1,
      AREA_DIVIDE: areaDivide,
      AREA_GAP: 10,
      DOT_COLOR: "lightgray",
      LINE_COLOR: "gray",
      NEAR_DOT_COLOR: "black",
      MOUSE_RANGE: (Math.min(...cvsSize) / areaDivide) * 2,
    };
  }, [cvsSize]);
  const ANIMATION_FRAME_ID = useRef<null | number>(null);

  // 컨테이너와 캔버스 체크 & 상태 저장
  useEffect(() => {
    if (!containerRef.current || !cvsRef.current) return;
    setContainer(containerRef.current);
    setCvs(cvsRef.current);
    setCtx(cvsRef.current.getContext("2d"));
    // document.body.style.cursor = "none";

    return () => {
      document.body.style.cursor = "auto";
    };
  }, [containerRef, cvsRef]);

  // 최초 및 리사이즈 시 영역 구분 및 점 생성
  const createDots = useCallback(
    (cvsWidth: number, cvsHeight: number) => {
      if (!isReady) return;

      const { AREA_GAP, AREA_DIVIDE } = ENV;
      const dots: Array<Dot> = [];

      // 캔버스 사이즈 지정
      cvs!.width = cvsWidth;
      cvs!.height = cvsHeight;

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

      // 각 영역당 하나씩 랜덤의 위치에 점 생성
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

  // 컨테이너 리사이즈 감시
  const resizeObserver = useMemo(
    () =>
      new ResizeObserver(
        _.debounce((entries) => {
          for (const entry of entries) {
            const { inlineSize: width, blockSize: height } =
              entry.borderBoxSize[0];
            setCvsSize([width, height]);
            createDots(width, height);
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

  // 마우스 움직임
  const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const mousePos: [number, number] = [
      e.nativeEvent.offsetX,
      e.nativeEvent.offsetY,
    ];

    setMousePos(mousePos);
  };

  // 터치 무브 핸들러
  const onTouchMove = (e: TouchEvent<HTMLCanvasElement>) => {
    e.stopPropagation();

    const mousePos: [number, number] = [
      e.touches[0].clientX,
      e.touches[0].clientY,
    ];

    setMousePos(mousePos);
  };

  // 점 위치 업데이트
  const updateDots = useCallback(
    ({
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
    },
    []
  );

  // 렌더
  const draw = useCallback(
    ({
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

      // 디버그용 영역 구분선
      // for (const area of areas) {
      //   const { startX, startY, width, height } = area;
      //   const areaShape = new Shape({
      //     strokeRect: {
      //       x: startX,
      //       y: startY,
      //       width,
      //       height,
      //     },
      //     lineWidth: 2,
      //     strokeStyle: "green",
      //   });
      //   drawQueue.push(areaShape);
      // }

      // 점들을 Shape 객체로 만들고 큐에 등록
      for (const curDot of dots) {
        const { x, y, radius, startAngle, endAngle, active } = curDot;

        // 점의 상태에 active일 경우 연결선을 그린다.
        if (active) {
          const controlX = (x + mouseX) / 2 + 20;
          const controlY = (y + mouseY) / 2 - 20;
          const curveShpae = new Shape({
            quadraticCurve: {
              moveTo: { x, y },
              quadraticCurveTo: {
                cpx: controlX,
                cpy: controlY,
                x: mouseX,
                y: mouseY,
              },
            },
            strokeStyle: LINE_COLOR,
            lineWidth: 2,
          });

          // drawQueue.push(curveShpae);
        }

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

      // 마우스 위치에 그릴 원
      // const centerShape = new Shape({
      //   arc: {
      //     x: mouseX,
      //     y: mouseY,
      //     radius: 10,
      //     startAngle: Math.PI * 2,
      //     endAngle: 0,
      //   },
      //   fillStyle: NEAR_DOT_COLOR,
      // });

      // drawQueue.push(centerShape);

      // 큐 실행
      while (drawQueue.length > 0) {
        const shape = drawQueue.shift();
        shape?.draw();
      }
    },
    []
  );

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

  return (
    <main ref={containerRef} className={styles.container}>
      <canvas
        className={styles.canvas}
        ref={cvsRef}
        onMouseMove={onMouseMove}
        onTouchMove={onTouchMove}
      />
    </main>
  );
};

export default Dots;
