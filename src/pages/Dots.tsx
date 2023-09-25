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
import classNames from "classnames";

interface ENV {
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
  const [isDebug, setIsDebug] = useState<boolean>(false);
  const cvsRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [cvs, setCvs] = useState<HTMLCanvasElement | null>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [areas, setAreas] = useState<Array<Area>>([]);
  const [dots, setDots] = useState<Array<Dot>>([]);
  const [cvsSize, setCvsSize] = useState<[number, number]>([0, 0]);
  const [mousePos, setMousePos] = useState<[number, number]>([0, 0]);
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
      e.touches[0].clientY - e.currentTarget.offsetTop,
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
          const curSpeed = distance / (active ? 5 : 10); // 남은 거리와 활성화 여부에 따라 속도 계산
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
            // 속도가 0보다 작을 경우
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

  // 그리기
  const draw = useCallback(
    ({
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
    },
    []
  );

  const debug = useCallback(
    ({
      mousePos,
      cvsSize,
      dots,
      areas,
      env,
      ctx,
    }: {
      mousePos: [number, number];
      cvsSize: [number, number];
      dots: Array<Dot>;
      env: ENV;
      areas: Array<Area>;
      ctx: CanvasRenderingContext2D;
    }) => {
      const [mouseX, mouseY] = mousePos;
      const [cvsWidth, cvsHeight] = cvsSize;
      const { LINE_COLOR } = env;

      // 그리기 명령 배열
      const drawCommands: Array<(ctx: CanvasRenderingContext2D) => void> = [];

      // 디버그용 영역 구분선
      for (const area of areas) {
        const { startX, startY, width, height } = area;

        drawCommands.push((ctx: CanvasRenderingContext2D) => {
          ctx.strokeStyle = "lightgray";
          ctx.beginPath();
          ctx.rect(startX, startY, width, height);
          ctx.closePath();
          ctx.stroke();
        });
      }

      // 디버그용 점 & 선
      for (const curDot of dots) {
        const { x, y, originX, originY, radius, startAngle, endAngle, active } =
          curDot;

        if (active) {
          drawCommands.push((ctx: CanvasRenderingContext2D) => {
            ctx.fillStyle = "firebrick";
            ctx.beginPath();
            ctx.arc(x, y, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = LINE_COLOR;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(mouseX, mouseY);
            ctx.stroke();
          });
        } else {
          const returnToOrigin = x !== originX || y !== originY;

          drawCommands.push((ctx: CanvasRenderingContext2D) => {
            ctx.fillStyle = returnToOrigin ? "orange" : "lightgray";
            ctx.beginPath();
            ctx.arc(x, y, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = LINE_COLOR;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(originX, originY);
            ctx.stroke();
          });
        }
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
      isDebug
        ? debug({
            cvsSize,
            mousePos,
            areas,
            env: ENV,
            dots,
            ctx: ctx as CanvasRenderingContext2D,
          })
        : draw({
            cvsSize,
            env: ENV,
            dots,
            ctx: ctx as CanvasRenderingContext2D,
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

  const onToggleDebug = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDebug((prev) => !prev);
  };

  return (
    <main ref={containerRef} className={styles.container}>
      <div className={styles["console"]}>
        <button
          className={classNames(
            styles["toggle-debug"],
            isDebug && styles["active"]
          )}
          onClick={onToggleDebug}
        >
          {isDebug ? "디버그 모드 끄기" : "디버그 모드"}
        </button>
        {isDebug && (
          <div className={styles["description"]}>
            <p>사각형 : 영역 구분</p>
            <p>주황 : 복귀 중</p>
            <p>빨강 : 마우스 범위 내</p>
          </div>
        )}
      </div>
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
