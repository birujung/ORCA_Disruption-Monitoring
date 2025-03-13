// import * as THREE from "https://esm.sh/three?module";
// import { TrackballControls } from "https://esm.sh/three/examples/jsm/controls/TrackballControls.js?external=three";
import { TrackballControls } from "three/addons/controls/TrackballControls.js";
import {
  Color,
  Scene,
  AmbientLight,
  DirectionalLight,
  Fog,
  PerspectiveCamera,
  Vector3,
  WebGLRenderer,
} from "three";
import ThreeGlobe from "three-globe";
import { useThree, Object3DNode, Canvas, extend } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

// import countries from "./ne_110m_admin_0_countries.json";
import { useEffect } from "react";

function Globe() {
  // console.log("countries", JSON.stringify(countries));
  // const N = 50;
  // const gData = [...Array(N).keys()].map(() => ({
  //   lat: (Math.random() - 0.5) * 180,
  //   lng: (Math.random() - 0.5) * 360,
  //   maxR: Math.random() * 20 + 3,
  //   propagationSpeed: (Math.random() - 0.5) * 20 + 1,
  //   repeatPeriod: Math.random() * 2000 + 200,
  // }));

  // const markerSvg = `<svg viewBox="-4 0 36 36">
  //     <path fill="currentColor" d="M14,0 C21.732,0 28,5.641 28,12.6 C28,23.963 14,36 14,36 C14,36 0,24.064 0,12.6 C0,5.641 6.268,0 14,0 Z"></path>
  //     <circle fill="black" cx="14" cy="14" r="7"></circle>
  //   </svg>`;

  // // Gen random data
  // const MarkerN = 30;
  // const markerData = [...Array(MarkerN).keys()].map(() => ({
  //   lat: (Math.random() - 0.5) * 180,
  //   lng: (Math.random() - 0.5) * 360,
  //   size: 7 + Math.random() * 30,
  //   color: ["red", "white", "blue", "green"][Math.round(Math.random() * 3)],
  // }));

  // const colorInterpolator = (t) => `rgba(155,10,150,${1 - t})`;
  // const Globe = new ThreeGlobe()
  //   .globeImageUrl(
  //     "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
  //   )
  //   .bumpImageUrl(
  //     "https://unpkg.com/three-globe/example/img/earth-topology.png",
  //   )
  //   .polygonsData(
  //     countries.features.filter((d) => d.properties.ISO_A2 !== "AQ"),
  //   )
  //   .polygonCapColor(() => "rgba(0, 0, 0, 0.1)")
  //   // .polygonSideColor(() => "rgba(200, 0, 0, 1)")
  //   .polygonStrokeColor(() => "#fff")
  //   .ringsData(gData)
  //   .ringColor(() => colorInterpolator)
  //   .ringMaxRadius("maxR")
  //   .polygonAltitude(0)
  //   .ringPropagationSpeed("propagationSpeed")
  //   .ringRepeatPeriod("repeatPeriod")
  //   .htmlElementsData(markerData)
  //   .htmlElement((d) => {
  //     const el = document.createElement("div");
  //     el.innerHTML = markerSvg;
  //     el.style.color = d.color;
  //     el.style.width = `${d.size}px`;
  //     return el;
  //   });

  // useEffect(() => {
  //   const renderer = new WebGLRenderer();
  //   renderer.setSize(window.innerWidth, window.innerHeight);
  //   renderer.setPixelRatio(window.devicePixelRatio);
  //   document.getElementById("globeViz").appendChild(renderer.domElement);

  //   // Setup scene
  //   const scene = new Scene();
  //   scene.add(Globe);
  //   scene.add(new AmbientLight(0xcccccc, Math.PI));
  //   scene.add(new DirectionalLight(0xffffff, 0.6 * Math.PI));

  //   // Setup camera
  //   const camera = new PerspectiveCamera();
  //   camera.aspect = window.innerWidth / window.innerHeight;
  //   camera.updateProjectionMatrix();
  //   camera.position.z = 500;

  //   // Add camera controls
  //   const tbControls = new TrackballControls(camera, renderer.domElement);
  //   tbControls.minDistance = 101;
  //   tbControls.rotateSpeed = 5;
  //   tbControls.zoomSpeed = 0.8;

  //   // Kick-off renderer
  //   (function animate() {
  //     // IIFE
  //     // Frame cycle
  //     tbControls.update();
  //     renderer.render(scene, camera);
  //     requestAnimationFrame(animate);
  //   })();
  // }, []);

  return <div style={{ height: "500px" }} id="globeViz"></div>;
}

export default Globe;
