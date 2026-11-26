#!/usr/bin/env node
/* Builds src/grove/kaykit.glb: one small GLB with every 3D model Pocket Grove uses.
   Source: KayKit packs by Kay Lousberg (CC0, https://github.com/KayKit-Game-Assets), cloned locally.
   Usage: node tools/grove/pack-models.js <folder with the cloned packs> <found.txt: repo|dir|name lines> */
'use strict';
const fs = require('fs'), path = require('path');
(async () => {
  const { NodeIO } = await import('@gltf-transform/core');
  const { Document } = await import('@gltf-transform/core');
  const { ALL_EXTENSIONS } = await import('@gltf-transform/extensions');
  const { mergeDocuments, dedup, prune, weld, quantize, unpartition, meshopt } = await import('@gltf-transform/functions');
  const { MeshoptEncoder } = await import('meshoptimizer');
  await MeshoptEncoder.ready;
  const [root, list] = process.argv.slice(2);
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
  const out = new Document();
  const lines = fs.readFileSync(list, 'utf8').trim().split('\n').map((l) => l.split('|'));
  const scene = out.createScene('pack'); out.createBuffer();
  for (const [repo, dir, name] of [...new Map(lines.map((l) => [l[2], l])).values()]) {
    const doc = await io.read(path.join(root, repo, dir, name + '.gltf'));
    const map = mergeDocuments(out, doc);
    const src = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
    const group = out.createNode(name);
    for (const child of src.listChildren()) group.addChild(map.get(child));
    scene.addChild(group);
    for (const s of out.getRoot().listScenes()) if (s !== scene) s.dispose();
  }
  out.getRoot().setDefaultScene(scene);
  await out.transform(unpartition(), dedup(), weld(), prune(), quantize(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  const glb = await io.writeBinary(out);
  fs.writeFileSync(path.join(__dirname, '../../src/grove/kaykit.glb'), glb);
  console.log('kaykit.glb', (glb.length / 1024).toFixed(0) + ' KB,', scene.listChildren().length, 'models,', out.getRoot().listTextures().length, 'textures');
})();
