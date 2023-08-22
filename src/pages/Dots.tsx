import {
  MouseEvent,
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

interface Dot {
  x: number;
  y: number;
  originX: number;
  originY: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  color: string;
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
  const Shape = useShape(ctx);

  const isReady = useMemo(
    () => !!cvs && !!ctx && !!container,
    [cvs, ctx, container]
  );

  const SPEED = 1;
  const AREA_DIVIDE = 10;
  const AREA_GAP = 20;
  const DOT_COLOR = "white";
  const NEAR_DOT_COLOR = "yellow";
  const MOUSE_RANGE = useMemo(
    () => (cvsSize[0] / AREA_DIVIDE) * 1.5,
    [cvsSize]
  );

  // 컨테이너와 캔버스 체크 & 상태 저장
  useEffect(() => {
    if (!containerRef.current || !cvsRef.current) return;
    setContainer(containerRef.current);
    setCvs(cvsRef.current);
    setCtx(cvsRef.current.getContext("2d"));
    document.body.style.cursor = "none";

    return () => {
      document.body.style.cursor = "auto";
    };
  }, [containerRef, cvsRef]);

  // 최초 및 리사이즈 시 렌더링
  const createDots = useCallback(
    (width: number, height: number) => {
      if (!isReady) return;

      const dots: Array<Dot> = [];

      // 캔버스 사이즈 지정
      cvs!.width = width;
      cvs!.height = height;

      // 영역 구분
      const areas: Array<Area> = [];
      const areaWidth = (width - AREA_GAP * (AREA_DIVIDE - 1)) / AREA_DIVIDE;
      const areaHeight = (height - AREA_GAP * (AREA_DIVIDE - 1)) / AREA_DIVIDE;

      for (let i = 1; i <= AREA_DIVIDE; i++) {
        const startY = (areaHeight + AREA_GAP) * (i - 1);
        const endY = startY + areaHeight;

        for (let j = 1; j <= AREA_DIVIDE; j++) {
          const startX = (areaWidth + AREA_GAP) * (j - 1);
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

        const dot = {
          x,
          y,
          targetX: null,
          targetY: null,
          originX: x,
          originY: y,
          radius: 5,
          startAngle: 0,
          endAngle: Math.PI * 2,
          color: DOT_COLOR,
          active: false,
        };

        // ctx!.beginPath();
        // ctx!.strokeStyle = "blue";
        // ctx!.lineWidth = 1;

        // ctx!.strokeRect(startX, startY, areaWidth, areaHeight);
        // ctx!.closePath();

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

  useEffect(() => {
    if (!isReady) return;

    const [mouseX, mouseY] = mousePos;

    // 마우스와 점들의 거리 계산
    const updateDots = () => {
      setDots((prev) => {
        const newDots: Array<Dot> = [];

        for (const dot of prev) {
          let speed = SPEED;
          const { x: dotX, originX, y: dotY, originY } = dot;
          const mouseDeltaX = mouseX - originX;
          const mouseDeltaY = mouseY - originY;
          const mouseDistance = Math.sqrt(mouseDeltaX ** 2 + mouseDeltaY ** 2);
          const active = mouseDistance <= MOUSE_RANGE ? true : false;
          let x, y, targetX, targetY: number;

          if (active) {
            targetX = mouseX - mouseDeltaX * 0.7;
            targetY = mouseY - mouseDeltaY * 0.7;
          } else {
            targetX = originX;
            targetY = originY;
            speed /= 10;
          }

          const deltaX = targetX - dotX; // 현재 x와 타겟 x의 거리
          const deltaY = targetY - dotY; // 현재 y와 타겟 y의 거리
          // 현재 점과 타겟 점 사이의 거리(유클리드 거리 공식)
          const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

          if (distance > speed) {
            // 핸재 점(foot[x, y])에서 타겟 점(nearDot[x, y])을 바라보는 라디안 각도
            const angle = Math.atan2(deltaY, deltaX);
            // 속도와 각도를 통해 각 방향의 속력 구하기
            const velocityX = speed * Math.cos(angle);
            const velocityY = speed * Math.sin(angle);
            // 새로운 x,y 좌표 계산
            x = dotX + velocityX;
            y = dotY + velocityY;
          } else {
            x = targetX;
            y = targetY;
          }

          newDots.push({
            ...dot,
            active,
            color: active ? NEAR_DOT_COLOR : DOT_COLOR,
            x,
            y,
          });
        }

        return newDots;
      });
    };

    // 렌더
    const draw = (dots: Array<Dot>) => {
      const drawQueue: Array<InstanceType<typeof Shape>> = [];

      ctx!.clearRect(0, 0, cvsSize[0], cvsSize[1]);

      for (const area of areas) {
        const { startX, startY, width, height } = area;
        ctx!.beginPath();
        ctx!.strokeStyle = "blue";
        ctx!.lineWidth = 1;
        ctx!.strokeRect(startX, startY, width, height);
        ctx!.closePath();
      }

      for (const curDot of dots) {
        const { x, y, radius, startAngle, endAngle, color, active } = curDot;

        if (active) {
          const controlX = (x + mouseX) / 2 + 20;
          const controlY = (y + mouseY) / 2 - 20;
          const curveShpae = new Shape({
            quadraticCurve: {
              moveTo: { x, y },
              QuadraticCurveTo: {
                cpx: controlX,
                cpy: controlY,
                x: mouseX,
                y: mouseY,
              },
              strokeStyle: "gray",
              lineWidth: 2,
            },
          });

          drawQueue.push(curveShpae);
        }

        const dotShape = new Shape({
          arc: {
            x,
            y,
            radius,
            startAngle,
            endAngle,
            fillStyle: color,
          },
        });

        drawQueue.push(dotShape);
      }

      const centerShape = new Shape({
        arc: {
          x: mouseX,
          y: mouseY,
          radius: 10,
          startAngle: Math.PI * 2,
          endAngle: 0,
          fillStyle: NEAR_DOT_COLOR,
        },
      });

      drawQueue.push(centerShape);

      for (let i = 0; i < drawQueue.length; i++) {
        const shape = drawQueue[i];
        shape.draw();
      }
    };

    const id = requestAnimationFrame(() => {
      console.log("frame");
      updateDots();
      draw(dots);
    });

    return () => {
      cancelAnimationFrame(id);
    };
  }, [ctx, cvsSize, dots, isReady, mousePos, MOUSE_RANGE, Shape]);

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
