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
import generateId from "../tools/generateId";
import dotSort from "../tools/dotSort";
import useShape from "../hooks/useShape";

// FIXME: 손이 다리를 뚫음. 순서 잘 맞추기
// TODO: draw 부분 코드가 너무 지저분함. 정리 좀 하기
// TODO: 바디와 너무 가까운 점은 순위에서 제거
// FIXME: 머리 svg 사이즈 기준을 height로 변경하기

const FACE = `
<svg id="_레이어_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <style>.cls-1{fill:#fff;}.cls-2{fill:#c80028;}.cls-3{fill:#0d52af;}.cls-4{fill:none;stroke:#3a000e;stroke-linecap:round;stroke-miterlimit:10;stroke-width:3.53px;}</style>
  </defs>
  <path class="cls-3" d="m294.06,112.88c-6.18,1.73-13.9-3.39-20.2-2.25s-12.06,4.95-18.45,5.48-12.71-.16-19.12-.25c-6.02-.09-11.75-2.05-17.41-2.25-6.03-.21-11.77-.82-17.41-1.14-6.04-.34-11.96,1.55-17.57,1.11-6.06-.48-11.8-1.35-17.38-1.91-6.08-.61-12.18,1.58-17.71.93-6.11-.72-11.24-6.51-16.72-7.23-6.16-.82-12.99,6.26-18.41,5.52-6.25-.85-11.53-5.15-16.88-5.77-6.4-.74-12.05-4.34-17.29-4.54-6.62-.26-12.66,1.86-17.72,2.87-8.46,1.69-15.78,4.41-20.13,8.27-9.03,8.02-10.26,8.59-12.05,19.02-.98,5.06,1.2,11.41,1.4,17.9.16,5.38.15,11.32,1.06,17.5.8,5.46.27,11.63,1.61,17.6,1.23,5.46,6.92,10.06,8.58,15.86,1.55,5.44.13,11.98,2.03,17.65s8.21,9.28,10.31,14.83-.75,12.73,1.53,18.17,9.27,8.57,11.72,13.91,1.04,12.36,3.66,17.59,8.49,8.68,11.28,13.8.96,12.87,3.91,17.88,8.99,8.24,12.12,13.12c3.17,4.95,4.92,10.82,8.23,15.54s9.94,7.21,13.45,11.76,4.11,11.8,7.85,16.12,7.69,8.86,12.3,12.78c4.29,3.64,9.26,7.16,14.27,10.47,4.73,3.13,8.96,8.03,14.23,10.81s11.52,3.21,16.98,5.51c5.29,2.22,10.31,6.05,15.92,7.89s11.4,3.26,17.11,4.66,11.66,2.11,17.44,3.06,11.63,2.84,17.45,3.34,11.95.74,17.77.76,11.52-3.74,17.08-4.33,10.77-4.32,16.26-5.52,12.43,2.06,17.77.25,11.65-2.51,16.79-4.89,8.47-8.8,13.36-11.69,9.85-5.74,14.46-9.08,10.08-5.72,14.4-9.44,6.56-9.67,10.58-13.72,7.41-8.5,11.13-12.82c3.69-4.29,5.65-9.83,9.09-14.38s5.85-9.5,9.01-14.24c3.14-4.72,9.73-7.18,12.62-12.07s1.59-12,4.22-17.03,9.67-7.83,12.04-12.97,4.52-10.49,6.64-15.73,2.24-11.33,4.1-16.64c1.9-5.42,3.3-10.86,4.9-16.24s6.87-10,8.2-15.44-1.99-12.16-.95-17.63,2.29-11.14,3-16.63c.75-5.81,7.31-10.95,7.65-16.44.36-5.9-2.03-11.85-2.16-17.29-.14-5.99-1.33-11.72-2.07-17.03-.85-6.04-6.84-10.16-8.46-15.16s3.56-13.69.5-18.55c-2.74-4.35-7.43-9.79-12.87-13.02-4.11-2.44-11.85,2.07-18.27.69-4.77-1.02-9.53-6.03-15.88-6.29-5.02-.21-10.79-1.96-16.96-1.61-5.13.29-10.73,1.92-16.74,2.64-5.18.62-10.68,2.05-16.56,3.03-5.2.86-11.21-.52-17,.63-5.22,1.04-9.45,8.03-15.17,9.32-5.22,1.18-11.68-1.88-17.33-.48-5.22,1.29-10.94,1.65-16.55,3.14-5.22,1.39-8.99,8.8-14.55,10.36Z"/>
  <path class="cls-2" d="m420.05,223.31c23.94,4.61,31.18,107.78-103.53,141.51-116.33,29.12-187.28-63.62-158.2-96.16,32.86-36.76,70.4,39.13,144.51,29.72,74.12-9.42,68.97-84.36,117.22-75.06Z"/>
  <path class="cls-4" d="m183.86,290.76c4.56,4.55,54.35,52.52,125.71,39.97,66.46-11.68,97.15-66.27,100.85-73.13"/>
  <ellipse class="cls-1" cx="341.72" cy="225.15" rx="29" ry="28.03" transform="translate(-49.29 104.41) rotate(-16.22)"/>
  <ellipse cx="340.96" cy="226.46" rx="22.8" ry="22.49"/>
  <ellipse class="cls-1" cx="245.93" cy="240.37" rx="29.89" ry="29.02" transform="translate(-57.35 78.26) rotate(-16.22)"/>
  <ellipse cx="245.25" cy="240.13" rx="22.8" ry="22.49"/>
</svg>
`;

type Dots = {
  [key in string]: Dot;
};

interface Dot {
  x: number;
  y: number;
}

interface DotDistance {
  id: string;
  distance: number;
}

type Feet = [Dot, Dot, Dot, Dot] | null;
type NearDots = [string, string, string, string] | null;

interface Area {
  startX: number;
  endX: number;
  startY: number;
  endY: number;
  width: number;
  height: number;
}

const HuggyWuggy = () => {
  const cvsRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [cvs, setCvs] = useState<HTMLCanvasElement | null>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [dots, setDots] = useState<Dots>({});
  const [nearDots, setNearDots] = useState<NearDots>(null);
  const [areas, setAreas] = useState<Array<Area>>([]);
  const [feet, setFeet] = useState<[Dot, Dot, Dot, Dot] | null>(null);
  const [cvsSize, setCvsSize] = useState<[number, number]>([0, 0]);
  const [mousePos, setMousePos] = useState<[number, number]>([0, 0]);
  const Shape = useShape(ctx);
  const isReady = useMemo(
    () => !!cvs && !!ctx && !!container,
    [cvs, ctx, container]
  );

  const AREA_DIVIDE = 10;
  const AREA_GAP = 20;
  const BODY_COLOR = "#0d52af";
  const LINE_COLOR = "green";
  const DOT_COLOR = "black";
  const SPEED = useMemo(() => cvsSize[0] / AREA_DIVIDE / 10, [cvsSize]);
  const BODY_WIDTH = useMemo(() => cvsSize[0] / AREA_DIVIDE / 3, [cvsSize]);
  const BODY_HEIGHT = useMemo(() => BODY_WIDTH * 2, [BODY_WIDTH]);
  const LIMBS_WIDTH = useMemo(() => BODY_WIDTH * 0.8, [BODY_WIDTH]);
  let ANIMATION_FRAME_ID: null | number = null;

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

  // 최초 및 리사이즈 시 점 생성
  const createDots = useCallback(
    (width: number, height: number) => {
      if (!isReady) return;

      const dots: Dots = {};

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
          radius: 5,
          startAngle: 0,
          endAngle: Math.PI * 2,
          color: DOT_COLOR,
          active: false,
        };

        dots[generateId()] = dot;
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

  // 마우스 무브 핸들러
  const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
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

  // 마우스에 맞춰 위치 계산 및 렌더
  useEffect(() => {
    if (!isReady) return;

    const [mouseX, mouseY] = mousePos;
    const [cvsWidth, cvsHeight] = cvsSize;

    // 팔다리 위치 계산
    const updateFeet = () => {
      const quadrant1: Array<DotDistance> = [];
      const quadrant2: Array<DotDistance> = [];
      const quadrant3: Array<DotDistance> = [];
      const quadrant4: Array<DotDistance> = [];

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
      const sortedQuadrant1 = dotSort(quadrant1);
      const sortedQuadrant2 = dotSort(quadrant2);
      const sortedQuadrant3 = dotSort(quadrant3);
      const sortedQuadrant4 = dotSort(quadrant4);

      const nearDot1 = sortedQuadrant1[0]?.id || sortedQuadrant3[1]?.id;
      const nearDot2 = sortedQuadrant2[0]?.id || sortedQuadrant4[1]?.id;
      const nearDot3 = sortedQuadrant3[0]?.id || sortedQuadrant1[1]?.id;
      const nearDot4 = sortedQuadrant4[0]?.id || sortedQuadrant2[1]?.id;
      const nearDots: NearDots = [nearDot1, nearDot2, nearDot3, nearDot4];
      setNearDots(nearDots);

      setFeet((prev) => {
        let newFeet: Feet = prev;

        if (
          (!prev && !dots[nearDot1]) ||
          !dots[nearDot2] ||
          !dots[nearDot3] ||
          !dots[nearDot4]
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

          if (distance > SPEED) {
            // 핸재 점(foot[x, y])에서 타겟 점(nearDot[x, y])을 바라보는 라디안 각도
            const angle = Math.atan2(deltaY, deltaX);
            // 속도와 각도를 통해 각 방향의 속력 구하기
            const velocityX = SPEED * Math.cos(angle);
            const velocityY = SPEED * Math.sin(angle);
            // 새로운 x,y 좌표 계산
            x = footX + velocityX;
            y = footY + velocityY;
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

    // 렌더
    const draw = (feet: Feet) => {
      const drawQueue: Array<InstanceType<typeof Shape>> = [];

      ctx!.clearRect(0, 0, cvsSize[0], cvsSize[1]);
      ctx!.lineCap = "round";

      // 디버그용 사분면 구분선
      const debugLineX = new Shape({
        line: {
          moveTo: { x: 0, y: mouseY },
          lineTo: { x: cvsWidth, y: mouseY },
          strokeStyle: LINE_COLOR,
          lineWidth: 1,
        },
      });

      const debugLineY = new Shape({
        line: {
          moveTo: { x: mouseX, y: 0 },
          lineTo: { x: mouseX, y: cvsHeight },
          strokeStyle: LINE_COLOR,
          lineWidth: 1,
        },
      });

      drawQueue.push(debugLineX, debugLineY);

      // 디버그용 Dot 렌더
      for (const [id, dot] of Object.entries(dots)) {
        const { x, y } = dot;
        const nearDotIndex = nearDots?.indexOf(id);
        const active = nearDotIndex !== -1;
        const radius = active ? 15 : 5;
        const fillStyle = active
          ? nearDotIndex === 0
            ? "red"
            : nearDotIndex === 1
            ? "orange"
            : nearDotIndex === 2
            ? "yellow"
            : "green"
          : "darkgray";

        const debugDot = new Shape({
          arc: {
            x,
            y,
            radius,
            startAngle: 0,
            endAngle: Math.PI * 2,
            fillStyle,
          },
        });

        drawQueue.push(debugDot);
      }

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
                fillStyle: "yellow",
              },
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
                fillStyle: "yellow",
              },
            });

            drawQueue.unshift(palm, thumb);

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
                fillStyle: "yellow",
              },
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
                fillStyle: "yellow",
              },
            });

            drawQueue.unshift(palm, thumb);

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
                fillStyle: "yellow",
              },
            });

            drawQueue.unshift(foot);
          }

          const limb = new Shape({
            quadraticCurve: {
              moveTo: { x, y },
              QuadraticCurveTo: {
                cpx: controlX,
                cpy: controlY,
                x: jointX,
                y: jointY,
              },
              strokeStyle: BODY_COLOR,
              lineWidth: LIMBS_WIDTH,
            },
          });

          drawQueue.push(limb);
        }
      }

      // 바디
      const body = new Shape({
        fillRect: {
          x: mouseX - BODY_WIDTH / 2,
          y: mouseY - BODY_HEIGHT / 2,
          width: BODY_WIDTH,
          height: BODY_HEIGHT - BODY_HEIGHT / 5,
          fillStyle: BODY_COLOR,
        },
      });

      const shoulder = new Shape({
        arc: {
          x: mouseX,
          y: mouseY - BODY_HEIGHT / 2,
          radius: BODY_WIDTH / 2,
          startAngle: Math.PI,
          endAngle: Math.PI * 2,
          fillStyle: BODY_COLOR,
        },
      });

      const ass = new Shape({
        arc: {
          x: mouseX,
          y: mouseY + BODY_HEIGHT / 2 - BODY_HEIGHT / 5,
          radius: BODY_WIDTH / 2,
          startAngle: Math.PI * 2,
          endAngle: Math.PI * 3,
          fillStyle: BODY_COLOR,
        },
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

      drawQueue.push(body, shoulder, ass, head);

      for (let i = 0; i < drawQueue.length; i++) {
        const shape = drawQueue[i];
        shape.draw();
      }

      // spotlight
      ctx!.beginPath();
      const gradient = ctx!.createRadialGradient(
        mouseX,
        mouseY,
        0,
        mouseX,
        mouseY,
        Math.min(...cvsSize) * 2
      );
      gradient.addColorStop(0.01, "rgba(200, 255, 255, 0)");
      gradient.addColorStop(0.03, "rgba(49, 63, 62, 0)");
      gradient.addColorStop(0.06, "rgba(33, 33, 33, 0.5)");
      gradient.addColorStop(0.08, "rgba(33, 33, 33, 0.8)");
      gradient.addColorStop(0.1, "rgba(33, 33, 33, 0.9)");
      gradient.addColorStop(0.15, "rgba(33, 33, 33, 1)");
      ctx!.arc(mouseX, mouseY, Math.max(...cvsSize) * 2, Math.PI * 2, 0);
      ctx!.fillStyle = gradient;
      ctx!.fill();
      ctx!.closePath();

      ANIMATION_FRAME_ID = requestAnimationFrame(() => {
        updateFeet();
        draw(feet);
      });
    };

    draw(feet);

    return () => {
      ANIMATION_FRAME_ID && cancelAnimationFrame(ANIMATION_FRAME_ID);
    };
  }, [ANIMATION_FRAME_ID, ctx, cvsSize, dots, feet, isReady, mousePos]);

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

export default HuggyWuggy;

// for (let i = 0; i < (feet?.length || 0); i++) {
//   const { x, y } = feet[i];
//   // 손
//   if (i <= 1) {
//     // 오른손
//     if (i === 0) {
//       ctx!.beginPath();
//       ctx!.ellipse(
//         x,
//         y - LIMBS_WIDTH / 4,
//         LIMBS_WIDTH * 0.5,
//         LIMBS_WIDTH * 0.8,
//         (Math.PI / 180) * 20,
//         0,
//         Math.PI * 2
//       );
//       ctx!.fillStyle = "yellow";
//       ctx!.fill();
//       ctx!.closePath();

//       ctx!.beginPath();
//       ctx!.ellipse(
//         x - LIMBS_WIDTH / 2,
//         y - LIMBS_WIDTH / 4,
//         LIMBS_WIDTH * 0.4,
//         LIMBS_WIDTH * 0.2,
//         (Math.PI / 180) * 45,
//         0,
//         Math.PI * 2
//       );
//       ctx!.fillStyle = "yellow";
//       ctx!.fill();
//       ctx!.closePath();

//       // 왼손
//     } else {
//       ctx!.beginPath();
//       ctx!.ellipse(
//         x,
//         y - LIMBS_WIDTH / 4,
//         LIMBS_WIDTH * 0.5,
//         LIMBS_WIDTH * 0.8,
//         (Math.PI / 180) * 340,
//         0,
//         Math.PI * 2
//       );
//       ctx!.fillStyle = "yellow";
//       ctx!.fill();
//       ctx!.closePath();

//       ctx!.beginPath();
//       ctx!.ellipse(
//         x + LIMBS_WIDTH / 2,
//         y - LIMBS_WIDTH / 4,
//         LIMBS_WIDTH * 0.4,
//         LIMBS_WIDTH * 0.2,
//         (Math.PI / 180) * 135,
//         0,
//         Math.PI * 2
//       );
//       ctx!.fillStyle = "yellow";
//       ctx!.fill();
//       ctx!.closePath();
//     }

//     // 발
//   } else {
//     ctx!.beginPath();
//     ctx!.ellipse(
//       x,
//       y - LIMBS_WIDTH / 5,
//       LIMBS_WIDTH * 0.6,
//       LIMBS_WIDTH * 0.8,
//       0,
//       0,
//       Math.PI * 2
//     );
//     ctx!.fillStyle = "yellow";
//     ctx!.fill();
//     ctx!.closePath();
//   }
// }
