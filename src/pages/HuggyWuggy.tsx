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
import styles from "./HuggyWuggy.module.scss";
import _ from "lodash";
import generateId from "../tools/generateId";
import dotSort from "../tools/dotSort";
import classNames from "classnames";

export interface ENV {
  AREA_DIVIDE: number;
  AREA_GAP: number;
  BODY_COLOR: string;
  FEET_COLOR: string;
  LINE_COLOR: string;
  DOT_COLOR: string;
  BODY_WIDTH: number;
  BODY_HEIGHT: number;
  LIMBS_WIDTH: number;
}

export type Dots = {
  [key in string]: Dot;
};

interface Dot {
  x: number;
  y: number;
  image: HTMLImageElement;
  trackingMouse: boolean;
}

interface DotDistance {
  id: string;
  distance: number;
}

export type Feet = [Dot, Dot, Dot, Dot] | null;
export type NearDots = [string, string, string, string] | null;

interface Area {
  startX: number;
  endX: number;
  startY: number;
  endY: number;
  width: number;
  height: number;
}

const HuggyWuggy = () => {
  const [isDebug, setIsDebug] = useState<boolean>(false);
  const [lightOn, setLightOn] = useState<boolean>(false);
  const cvsRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [cvs, setCvs] = useState<HTMLCanvasElement | null>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [offscreenCvs, setOffscreenCvs] = useState<HTMLCanvasElement | null>(
    null
  );
  const [offscreenCtx, setOffscreenCtx] =
    useState<CanvasRenderingContext2D | null>(null);
  const [dots, setDots] = useState<Dots>({});
  const [nearDots, setNearDots] = useState<NearDots>(null);
  const [areas, setAreas] = useState<Array<Area>>([]);
  const [quadrants, setQuadrants] = useState<Array<Array<DotDistance>>>([]);
  const [feet, setFeet] = useState<[Dot, Dot, Dot, Dot] | null>(null);
  const [bodyPos, setBodyPos] = useState<[number, number]>([0, 0]);
  const [cvsSize, setCvsSize] = useState<[number, number]>([10, 10]);
  const [mousePos, setMousePos] = useState<[number, number]>([0, 0]);
  const isReady = useMemo(
    () => !!cvs && !!ctx && !!container && !!offscreenCvs && !!offscreenCtx,
    [cvs, ctx, container, offscreenCvs, offscreenCtx]
  );

  const ENV = useMemo(() => {
    const areaDivide = 10;
    const bodyWidth = cvsSize[0] / areaDivide / 4;

    return {
      AREA_DIVIDE: areaDivide,
      AREA_GAP: 20,
      BODY_COLOR: "#0d52af",
      FEET_COLOR: "#ffec00",
      LINE_COLOR: "lightgray",
      DOT_COLOR: "black",
      BODY_WIDTH: bodyWidth,
      BODY_HEIGHT: bodyWidth * 2.3,
      LIMBS_WIDTH: bodyWidth * 0.8,
    };
  }, [cvsSize]);

  const ANIMATION_FRAME_ID = useRef<null | number>(null);

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
  }, [containerRef, cvsRef]);

  // 최초 및 리사이즈 시 영역 구분 및 점 생성
  const createDots = useCallback(
    (cvsWidth: number, cvsHeight: number) => {
      if (!isReady) return;
      const { AREA_GAP, AREA_DIVIDE } = ENV;
      const dots: Dots = {};

      // 캔버스 사이즈 지정
      cvs!.width = cvsWidth;
      cvs!.height = cvsHeight;
      offscreenCvs!.width = cvsWidth;
      offscreenCvs!.height = cvsHeight;

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

        // 클라이밍 홀드 이미지 부여
        const image = new Image();
        const holdNum = Math.floor(Math.random() * 4) + 1;
        image.src = `/images/hold${holdNum}.png`;

        const dot = {
          x,
          y,
          image,
          trackingMouse: false,
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
      e.touches[0].pageX,
      e.touches[0].pageY - e.currentTarget.offsetTop,
    ];

    setMousePos(mousePos);
  };
  // 팔다리 위치 계산
  const updateFeet = useCallback(
    ({
      mousePos,
      bodyPos,
      dots,
      nearDotSetter,
      feetSetter,
      sortFx,
      env,
      bodySetter,
    }: {
      mousePos: [number, number];
      bodyPos: [number, number];
      dots: Dots;
      nearDotSetter: Dispatch<SetStateAction<NearDots>>;
      feetSetter: Dispatch<SetStateAction<Feet>>;
      bodySetter: Dispatch<SetStateAction<[number, number]>>;
      env: ENV;
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
      const { BODY_HEIGHT, LIMBS_WIDTH } = env;
      const [bodyX, bodyY] = bodyPos;
      const [mouseX, mouseY] = mousePos;
      const mouseBodyX = mouseX;
      const mouseBodyY = mouseY + BODY_HEIGHT;

      // 몸통 위치
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

      const quadrant1: Array<DotDistance> = [],
        quadrant2: Array<DotDistance> = [],
        quadrant3: Array<DotDistance> = [],
        quadrant4: Array<DotDistance> = [];

      // 각 점과 마우스 사이 거리 계산 후 사분면으로 나눠서 저장
      for (const [id, dot] of Object.entries(dots)) {
        const { x: dotX, y: dotY } = dot;
        const [bodyX, bodyY] = bodyPos;

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

      // 각 사분면의 점들을 마우스 거리 가까운 순으로 정렬
      const sortedQuadrant1 = sortFx(quadrant1),
        sortedQuadrant2 = sortFx(quadrant2),
        sortedQuadrant3 = sortFx(quadrant3),
        sortedQuadrant4 = sortFx(quadrant4);

      setQuadrants([
        sortedQuadrant1,
        sortedQuadrant2,
        sortedQuadrant3,
        sortedQuadrant4,
      ]);

      const nearDot1 = sortedQuadrant1[0]?.id || sortedQuadrant3[1]?.id,
        nearDot2 = sortedQuadrant2[0]?.id || sortedQuadrant4[1]?.id,
        nearDot3 = sortedQuadrant3[0]?.id || sortedQuadrant1[1]?.id,
        nearDot4 = sortedQuadrant4[0]?.id || sortedQuadrant2[1]?.id,
        nearDots: NearDots = [nearDot1, nearDot2, nearDot3, nearDot4];

      nearDotSetter(nearDots);
      feetSetter((prev) => {
        let newFeet: Feet = prev;

        if (
          !prev &&
          (!dots[nearDot1] ||
            !dots[nearDot2] ||
            !dots[nearDot3] ||
            !dots[nearDot4])
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
                ((bodyX -
                  mouseX -
                  Math.sign(bodyX - mouseX) * LIMBS_WIDTH * 2) /
                  (LIMBS_WIDTH * 4));
            // 손의 y위치는 마우스와 항상 일정한 거리를 유지한다.
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
    },
    []
  );

  // 그리기
  const draw = useCallback(
    ({
      mousePos,
      bodyPos,
      cvsSize,
      feet,
      dots,
      env,
      offscreenCtx,
      offscreenCvs,
      ctx,
      lightOn,
    }: {
      mousePos: [number, number];
      bodyPos: [number, number];
      cvsSize: [number, number];
      feet: Feet;
      dots: Dots;
      env: ENV;
      ctx: CanvasRenderingContext2D;
      offscreenCtx: CanvasRenderingContext2D;
      offscreenCvs: HTMLCanvasElement;
      lightOn: boolean;
    }) => {
      const { LIMBS_WIDTH, BODY_COLOR, FEET_COLOR, BODY_HEIGHT, BODY_WIDTH } =
        env;
      const [cvsWidth, cvsHeight] = cvsSize;
      const [bodyX, bodyY] = bodyPos;
      const [mouseX, mouseY] = mousePos;

      // 그리기 명령 배열
      const drawCommands1: Array<(ctx: CanvasRenderingContext2D) => void> = [];
      const drawCommands2: Array<(ctx: CanvasRenderingContext2D) => void> = [];
      const drawCommands3: Array<(ctx: CanvasRenderingContext2D) => void> = [];

      // 팔다리 몸통 그리기
      // 팔다리
      if (!!feet) {
        for (let i = 0; i < feet.length; i++) {
          let { x, y } = feet[i];
          let jointX = bodyX;
          let jointY = bodyY;
          let controlX = (x + jointX) / 2;
          let controlY = (y + jointY) / 2;

          // 오른팔
          if (i === 0) {
            jointX += BODY_WIDTH / 2 - LIMBS_WIDTH / 2;
            jointY -= BODY_HEIGHT / 2;

            // 왼팔
          } else if (i === 1) {
            jointX -= BODY_WIDTH / 2 - LIMBS_WIDTH / 2;
            jointY -= BODY_HEIGHT / 2;

            // 왼다리
          } else if (i === 2) {
            jointX -= BODY_WIDTH / 2 - LIMBS_WIDTH / 2;
            jointY += BODY_HEIGHT / 2 - LIMBS_WIDTH / 2;
            controlY -= LIMBS_WIDTH;
            // 오른 다리
          } else {
            jointX += BODY_WIDTH / 2 - LIMBS_WIDTH / 2;
            jointY += BODY_HEIGHT / 2 - LIMBS_WIDTH / 2;
            controlY -= LIMBS_WIDTH;
          }
          // 팔인 경우와 다리인 경우의 중첩 순서 조절
          (i <= 1 ? drawCommands3 : drawCommands2).push(
            (ctx: CanvasRenderingContext2D) => {
              ctx.strokeStyle = BODY_COLOR;
              ctx.lineCap = "round";
              ctx.lineWidth = LIMBS_WIDTH;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.quadraticCurveTo(controlX, controlY, jointX, jointY);
              ctx.stroke();
            }
          );
        }
      }

      // 몸통
      drawCommands2.push((ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = BODY_COLOR;
        ctx.beginPath();
        ctx.rect(
          bodyX - BODY_WIDTH / 2,
          bodyY - BODY_HEIGHT / 2,
          BODY_WIDTH,
          BODY_HEIGHT - BODY_HEIGHT / 5
        );
        ctx.closePath();
        ctx.fill();
      });

      // 어깨
      drawCommands2.push((ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = BODY_COLOR;
        ctx.beginPath();
        ctx.arc(
          bodyX,
          bodyY - BODY_HEIGHT / 2,
          BODY_WIDTH / 2,
          Math.PI,
          Math.PI * 2
        );
        ctx.closePath();
        ctx.fill();
      });

      // 엉덩이
      drawCommands2.push((ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = BODY_COLOR;
        ctx.beginPath();
        ctx.arc(
          bodyX,
          bodyY + BODY_HEIGHT / 2 - BODY_HEIGHT / 5,
          BODY_WIDTH / 2,
          Math.PI * 2,
          Math.PI * 3
        );
        ctx.closePath();
        ctx.fill();
      });

      // 손발 그리기
      if (!!feet) {
        for (let i = 0; i < feet?.length; i++) {
          const { x, y, trackingMouse } = feet[i];

          // 가리키는 손가락과 마우스 사이의 각도를 계산하여 손가락이 마우스 위치를 똑바로 가리키도록 한다.
          const deltaX = x - mouseX;
          const deltaY = y - mouseY;
          const angle = -Math.atan2(deltaX, deltaY);

          // 오른손
          if (i === 0) {
            // 활성화된 손은 마우스를 가리키는 검지손가락을 그린다.
            if (trackingMouse) {
              const img = new Image();
              img.src = `/images/huggy_wuggy_finger.svg`;

              drawCommands3.unshift((ctx: CanvasRenderingContext2D) => {
                // 계산한 각도로 컨텍스트 회전
                ctx.rotate(angle);

                // 회전된 좌표계 내에서 손 위치 계산
                const rotatedRHandX = x * Math.cos(angle) + y * Math.sin(angle);
                const rotatedRHandY =
                  -x * Math.sin(angle) + y * Math.cos(angle);

                ctx.drawImage(
                  img,
                  rotatedRHandX - LIMBS_WIDTH,
                  rotatedRHandY - LIMBS_WIDTH * 1.5,
                  LIMBS_WIDTH * 2,
                  LIMBS_WIDTH * 2
                );

                ctx.setTransform(1, 0, 0, 1, 0, 0);
              });
              // 활성화되지 않은 손은 그냥 손만 그린다.
            } else {
              drawCommands2.unshift((ctx: CanvasRenderingContext2D) => {
                ctx.fillStyle = FEET_COLOR;
                ctx.beginPath();
                ctx.ellipse(
                  x,
                  y - LIMBS_WIDTH / 4,
                  LIMBS_WIDTH * 0.5,
                  LIMBS_WIDTH * 0.8,
                  (Math.PI / 180) * 20,
                  0,
                  Math.PI * 2
                );
                ctx.ellipse(
                  x - LIMBS_WIDTH / 2,
                  y - LIMBS_WIDTH / 4,
                  LIMBS_WIDTH * 0.4,
                  LIMBS_WIDTH * 0.2,
                  (Math.PI / 180) * 45,
                  0,
                  Math.PI * 2
                );
                ctx.closePath();
                ctx.fill();
              });
            }
            // 왼손
            // 방향 등만 다르고 그 외는 오른손과 동일하다.
          } else if (i === 1) {
            if (trackingMouse) {
              const img = new Image();
              img.src = `/images/huggy_wuggy_left_finger.svg`;

              drawCommands3.unshift((ctx: CanvasRenderingContext2D) => {
                ctx.rotate(angle);

                const rotatedRHandX = x * Math.cos(angle) + y * Math.sin(angle);
                const rotatedRHandY =
                  -x * Math.sin(angle) + y * Math.cos(angle);

                ctx.drawImage(
                  img,
                  rotatedRHandX - LIMBS_WIDTH,
                  rotatedRHandY - LIMBS_WIDTH * 1.5,
                  LIMBS_WIDTH * 2,
                  LIMBS_WIDTH * 2
                );

                ctx.setTransform(1, 0, 0, 1, 0, 0);
              });
            } else {
              drawCommands2.unshift((ctx: CanvasRenderingContext2D) => {
                ctx.fillStyle = FEET_COLOR;
                ctx.beginPath();
                ctx.ellipse(
                  x,
                  y - LIMBS_WIDTH / 4,
                  LIMBS_WIDTH * 0.5,
                  LIMBS_WIDTH * 0.8,
                  (Math.PI / 180) * 340,
                  0,
                  Math.PI * 2
                );
                ctx.ellipse(
                  x + LIMBS_WIDTH / 2,
                  y - LIMBS_WIDTH / 4,
                  LIMBS_WIDTH * 0.4,
                  LIMBS_WIDTH * 0.2,
                  (Math.PI / 180) * 135,
                  0,
                  Math.PI * 2
                );
                ctx.closePath();
                ctx.fill();
              });
            }
            // 발
          } else {
            drawCommands2.unshift((ctx: CanvasRenderingContext2D) => {
              ctx.fillStyle = FEET_COLOR;
              ctx.beginPath();
              ctx.ellipse(
                x,
                y - LIMBS_WIDTH / 5,
                LIMBS_WIDTH * 0.6,
                LIMBS_WIDTH * 0.8,
                0,
                0,
                Math.PI * 2
              );
              ctx.closePath();
              ctx.fill();
            });
          }
        }
      }

      // 머리
      drawCommands3.push((ctx: CanvasRenderingContext2D) => {
        const img = new Image();
        img.src = `/images/huggy_wuggy.svg`;

        ctx.drawImage(
          img,
          bodyX - BODY_WIDTH * 1.5,
          bodyY - BODY_HEIGHT * 1.5,
          BODY_WIDTH * 3,
          BODY_WIDTH * 3
        );
      });

      // 플래시라이트
      // 실제 빛을 비추는 느낌을 주기 위해 비추는 위치 따라 사이즈와 각도를 변경
      if (!lightOn) {
        drawCommands3.push((ctx: CanvasRenderingContext2D) => {
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
          const width = vmax * 7;
          // 플래시라이트 이미지 높이, normalizedDeltaY에 따라 가변.
          const height = vmax * 7 + vmax * normalizedDeltaY * 5;
          // 각도 계산, deltaFromCenterX에 따라 가변.
          const angle =
            -Math.atan2(mouseY - cvsHeight * 1.5, deltaFromCenterX) +
            (-90 * Math.PI) / 180;

          // 계산한 각도로 컨텍스트 회전
          ctx.rotate(angle);

          // 회전된 좌표계 내에서 마우스 위치 계산
          const rotatedMouseX =
            mouseX * Math.cos(angle) + mouseY * Math.sin(angle);
          const rotatedMouseY =
            -mouseX * Math.sin(angle) + mouseY * Math.cos(angle);

          ctx.drawImage(
            img,
            rotatedMouseX - width / 2,
            rotatedMouseY - height / 2,
            width,
            height
          );

          ctx.setTransform(1, 0, 0, 1, 0, 0);
        });
      }

      // 클라이밍 홀드
      for (const [id, { x, y, image }] of Object.entries(dots)) {
        drawCommands1.unshift((ctx: CanvasRenderingContext2D) => {
          ctx.drawImage(
            image,
            x - (BODY_WIDTH * 1.5) / 2,
            y - BODY_WIDTH,
            BODY_WIDTH * 1.3,
            BODY_WIDTH * 1.3
          );
        });
      }

      // 캔버스 전체 지우기 및 설정
      drawCommands1.unshift((ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, cvsWidth, cvsHeight);
      });

      const allDrawCommands = drawCommands1.concat(
        drawCommands2,
        drawCommands3
      );

      // 모든 그리기 명령 실행
      for (let i = 0; i < allDrawCommands.length; i++) {
        const command = allDrawCommands[i];
        command(offscreenCtx);
      }

      // 더블 버퍼링
      ctx.clearRect(0, 0, ...cvsSize);
      ctx.drawImage(offscreenCvs!, 0, 0);
    },
    []
  );

  const debug = useCallback(
    ({
      dots,
      quadrants,
      mousePos,
      bodyPos,
      cvsSize,
      env,
      ctx,
      offscreenCtx,
      offscreenCvs,
      feet,
    }: {
      dots: Dots;
      quadrants: Array<Array<DotDistance>>;
      mousePos: [number, number];
      bodyPos: [number, number];
      cvsSize: [number, number];
      env: ENV;
      ctx: CanvasRenderingContext2D;
      offscreenCtx: CanvasRenderingContext2D;
      offscreenCvs: HTMLCanvasElement;
      feet: Feet;
    }) => {
      const [mouseX, mouseY] = mousePos;
      const [bodyX, bodyY] = bodyPos;
      const [cvsWidth, cvsHeight] = cvsSize;
      const { LINE_COLOR } = env;

      // 그리기 명령 배열
      const drawCommands: Array<(ctx: CanvasRenderingContext2D) => void> = [];

      // 디버그용 dot
      for (let i = 0; i < quadrants.length; i++) {
        const quadrantDots = quadrants[i];

        for (let j = 0; j < quadrantDots.length; j++) {
          const { id } = quadrantDots[j];

          if (!dots[id]) continue;

          const { x, y } = dots[id];

          drawCommands.push((ctx: CanvasRenderingContext2D) => {
            ctx.fillStyle =
              i === 0
                ? "pink"
                : i === 1
                ? "yellow"
                : i === 2
                ? "skyblue"
                : "lightgreen";
            ctx.beginPath();
            ctx.arc(x, y, 10, Math.PI * 2, 0);
            ctx.fill();
            ctx.closePath();

            ctx.font = "bold 16px Arial";
            ctx.fillStyle = "black";
            ctx.fillText((j + 1).toString(), x - 8, y + 4);
          });
        }
      }

      // 디버그용 팔다리 표시
      if (!!feet) {
        for (let i = 0; i < feet.length; i++) {
          const { x, y, trackingMouse } = feet[i];

          drawCommands.push((ctx: CanvasRenderingContext2D) => {
            ctx.strokeStyle = trackingMouse ? "orange" : "blue";
            ctx.lineWidth = trackingMouse ? 4 : 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(bodyX, bodyY);
            ctx.stroke();
          });

          if (trackingMouse) {
            drawCommands.push((ctx: CanvasRenderingContext2D) => {
              const deltaX = x - mouseX;
              const deltaY = y - mouseY;
              const angle = -Math.atan2(deltaX, deltaY);

              // 계산한 각도로 컨텍스트 회전
              ctx.rotate(angle);

              // 회전된 좌표계 내에서 손 위치 계산
              const rotatedRHandX = x * Math.cos(angle) + y * Math.sin(angle);
              const rotatedRHandY = -x * Math.sin(angle) + y * Math.cos(angle);
              ctx.fillStyle = "orange";
              ctx.beginPath();
              ctx.ellipse(
                rotatedRHandX,
                rotatedRHandY,
                5,
                20,
                0,
                Math.PI * 2,
                0
              );
              ctx.closePath();
              ctx.fill();

              ctx.fillStyle = "black";
              ctx.font = "bold 16px Arial";
              ctx.fillText(
                "hand: " + angle.toFixed(5) + " rad ",
                rotatedRHandX + 5,
                rotatedRHandY - 5
              );

              ctx.setTransform(1, 0, 0, 1, 0, 0);
            });
          }
        }
      }

      // 디버그용 사분면 구분선
      drawCommands.push((ctx: CanvasRenderingContext2D) => {
        ctx.strokeStyle = LINE_COLOR;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, mouseY);
        ctx.lineTo(cvsWidth, mouseY);
        ctx.moveTo(mouseX, 0);
        ctx.lineTo(mouseX, cvsHeight);
        ctx.stroke();
      });

      // 디버그용 플래시라이트
      drawCommands.push((ctx: CanvasRenderingContext2D) => {
        // 컨텍스트 회전하기 전에 각도 표시
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cvsWidth / 2, mouseY);
        ctx.lineTo(cvsWidth / 2, cvsHeight);
        ctx.moveTo(mouseX, mouseY);
        ctx.lineTo(cvsWidth / 2, mouseY);
        ctx.moveTo(mouseX, mouseY);
        ctx.lineTo(cvsWidth / 2, cvsHeight * 1.5);
        ctx.stroke();

        ctx.strokeStyle = "red";

        const vmax = Math.max(...cvsSize);
        const img = new Image();
        img.src = `/images/flashlight.svg`;

        // 중앙과 마우스x 사이 거리
        const deltaFromCenterX = cvsWidth / 2 - mouseX;
        // 바닥과 마우스y 사이 거리
        const deltaFromBottomY = cvsHeight - mouseY;
        // // deltaFromBottomY 정규화
        const normalizedDeltaY = deltaFromBottomY / cvsHeight;

        // 플래시라이트 이미지 너비
        const radiusX = vmax * 0.15;
        // 플래시라이트 이미지 높이, normalizedDeltaY에 따라 가변.
        const radiusY = vmax * 0.15 + vmax * normalizedDeltaY * 0.15;
        // 각도 계산, deltaFromCenterX에 따라 가변.
        const angle =
          -Math.atan2(mouseY - cvsHeight * 1.5, deltaFromCenterX) +
          (-90 * Math.PI) / 180;

        // 계산한 각도로 컨텍스트 회전
        ctx.rotate(angle);

        // 회전된 좌표계 내에서 마우스 위치 계산
        const rotatedMouseX =
          mouseX * Math.cos(angle) + mouseY * Math.sin(angle);
        const rotatedMouseY =
          -mouseX * Math.sin(angle) + mouseY * Math.cos(angle);

        // 플래시라이트 영역 표시
        ctx.beginPath();
        ctx.ellipse(
          rotatedMouseX,
          rotatedMouseY,
          radiusX,
          radiusY,
          0,
          Math.PI * 2,
          0
        );
        ctx.closePath();
        ctx.stroke();

        // x 지름 선 표시
        ctx.beginPath();
        ctx.moveTo(rotatedMouseX - radiusX, rotatedMouseY);
        ctx.lineTo(rotatedMouseX + radiusX, rotatedMouseY);
        // y 지름 선 표시
        ctx.moveTo(rotatedMouseX, rotatedMouseY - radiusY);
        ctx.lineTo(rotatedMouseX, rotatedMouseY);
        ctx.stroke();

        // 텍스트 표시
        ctx.fillStyle = "black";
        ctx.font = "bold 16px Arial";
        ctx.fillText(
          "flashlight: " + angle.toFixed(5) + " rad ",
          rotatedMouseX + 5,
          rotatedMouseY - 5
        );
        ctx.fillStyle = "red";
        ctx.fillText(
          "radiusX : " + radiusX.toFixed(2),
          rotatedMouseX - radiusX - 65,
          rotatedMouseY - 5
        );
        ctx.fillText(
          "radiusY : " + radiusY.toFixed(2),
          rotatedMouseX - 65,
          rotatedMouseY - radiusY - 5
        );

        ctx.setTransform(1, 0, 0, 1, 0, 0);
      });

      // 캔버스 전체 지우기 및 설정
      drawCommands.unshift((ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, cvsWidth, cvsHeight);
      });

      // 모든 그리기 명령 실행
      for (let i = 0; i < drawCommands.length; i++) {
        const command = drawCommands[i];
        command(offscreenCtx);
      }

      // 더블 버퍼링
      ctx.clearRect(0, 0, ...cvsSize);
      ctx.drawImage(offscreenCvs!, 0, 0);
    },
    []
  );

  const updateAndDraw = useCallback(() => {
    ANIMATION_FRAME_ID.current = requestAnimationFrame(() => {
      updateFeet({
        mousePos,
        bodyPos,
        bodySetter: setBodyPos,
        env: ENV,
        dots,
        nearDotSetter: setNearDots,
        feetSetter: setFeet,
        sortFx: dotSort,
      });

      isDebug
        ? debug({
            feet,
            env: ENV,
            mousePos,
            bodyPos,
            cvsSize,
            dots,
            quadrants,
            ctx: ctx as CanvasRenderingContext2D,
            offscreenCtx: offscreenCtx as CanvasRenderingContext2D,
            offscreenCvs: offscreenCvs as HTMLCanvasElement,
          })
        : draw({
            mousePos,
            bodyPos,
            cvsSize,
            feet,
            dots,
            env: ENV,
            ctx: ctx as CanvasRenderingContext2D,
            offscreenCtx: offscreenCtx as CanvasRenderingContext2D,
            offscreenCvs: offscreenCvs as HTMLCanvasElement,
            lightOn,
          });

      updateAndDraw();
    });
  }, [
    updateFeet,
    mousePos,
    bodyPos,
    ENV,
    dots,
    isDebug,
    debug,
    feet,
    cvsSize,
    quadrants,
    ctx,
    offscreenCtx,
    offscreenCvs,
    draw,
    lightOn,
  ]);

  useEffect(() => {
    if (!isReady) return;

    updateAndDraw();

    return () => {
      ANIMATION_FRAME_ID.current &&
        cancelAnimationFrame(ANIMATION_FRAME_ID.current);
    };
  }, [isReady, updateAndDraw]);

  const onToggleDebug = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDebug((prev) => !prev);
  };

  const onLightToggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLightOn((prev) => !prev);
  };

  return (
    <main ref={containerRef} className={styles.container}>
      <div className={styles["console"]}>
        <button
          className={classNames(
            styles["toggle-btn"],
            isDebug && styles["active"]
          )}
          onClick={onToggleDebug}
        >
          {isDebug ? "디버그 모드 끄기" : "디버그 모드"}
        </button>
        {!isDebug && (
          <button
            className={classNames(styles["toggle-btn"])}
            onClick={onLightToggle}
          >
            {lightOn ? "불 끄기" : "불 켜기"}
          </button>
        )}
        {isDebug && (
          <p style={{ position: "absolute", left: 0, top: 0 }}>
            렌더링한 프레임 수 : {ANIMATION_FRAME_ID.current}
          </p>
        )}
      </div>
      <canvas
        style={{ background: isDebug ? "white" : "none" }}
        className={styles.canvas}
        ref={cvsRef}
        onMouseMove={onMouseMove}
        onTouchMove={onTouchMove}
      />
    </main>
  );
};

export default HuggyWuggy;
