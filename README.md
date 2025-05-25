# 3D Reconstruction from a Single Image using Depth Estimation

This project provides a pipeline to reconstruct a 3D surface mesh and point cloud from a single RGB image using state-of-the-art monocular depth estimation based on Vision Transformers. It is suitable for developers, researchers, and enthusiasts aiming to convert 2D photos into 3D models without requiring multiple viewpoints.

---

## Overview

The backbone of this system is the **MiDaS v3.1 - DPT** model, a high-performance monocular depth estimator. It is built upon transformer-based vision models and trained on a large, diverse collection of datasets for broad generalization across scenes.

This model provides high-resolution, scale-consistent depth maps which serve as a foundation for computing 3D coordinates. These coordinates are refined into colored point clouds and used to reconstruct accurate surface meshes.

> This work uses the MiDaS model from:
>
> **Ranftl et al., "Vision Transformers for Dense Prediction"**, 2021  
> [arXiv:2103.13413](https://arxiv.org/abs/2103.13413)

---

## Features

- Depth estimation using MiDaS (DPT-based ViT)
- 3D point cloud generation using backprojection and camera intrinsics
- Statistical outlier removal and voxel downsampling
- Normal estimation and surface reconstruction
- Mesh visualization and export
- Optional web interface for browser-based interaction
- GPU acceleration via PyTorch when available

---

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Deepak200440022/web_app_3d_img.git
cd web_app_3d_img/web_3d_app
pip install -r requirements.txt
```

> Make sure your system has Python 3.7 or higher and at least **1.3 GB** of free disk space and stable internet connection for initial model download.

---

## Usage

### Option 1: Python Script

Run 3D generation directly using:

```bash
python gen.py --rgb input/path_to_image.jpg --out output/path_to_model.ply
```

This performs all processing steps and saves the output model (point cloud or mesh) to the specified path.

### Option 2: Web Application

Launch the browser interface by running:

```bash
python app.py
```

Visit the printed `localhost` URL (e.g., `http://127.0.0.1:5000`) to upload an image and download the resulting 3D mesh.

> **Note**:
> - On the **first run**, the system will automatically download the pre-trained MiDaS model (~1.3 GB).
> - Ensure your internet connection is stable.
> - Processing time depends on your device's CPU/GPU capability.
> - Refer to the terminal output to monitor progress or debug errors.

---

## Output

- `depth_map`: Grayscale depth image as a NumPy float32 array
- `point_cloud`: Colored point cloud in PLY/VTK format
- `mesh`: Reconstructed mesh as a TriangleMesh (Open3D) or PolyData (PyVista)

All outputs can be visualized or exported using Open3D, PyVista, or Meshlab.

---

## Model Citation

If you use this project or its depth estimation approach, cite the original MiDaS model:

```bibtex
@article{DBLP:journals/corr/abs-2103-13413,
  author    = {Ren{'{e}} Ranftl and
               Alexey Bochkovskiy and
               Vladlen Koltun},
  title     = {Vision Transformers for Dense Prediction},
  journal   = {CoRR},
  volume    = {abs/2103.13413},
  year      = {2021},
  url       = {https://arxiv.org/abs/2103.13413},
  eprinttype = {arXiv},
  eprint    = {2103.13413},
  timestamp = {Wed, 07 Apr 2021 15:31:46 +0200},
  biburl    = {https://dblp.org/rec/journals/corr/abs-2103.13413.bib},
  bibsource = {dblp computer science bibliography, https://dblp.org}
}
```

---

## Acknowledgements

- MiDaS depth models by Intel Intelligent Systems Lab
- Open3D library for point cloud and mesh processing
- PyVista for advanced visualization and mesh export
- Torch and NumPy for tensor operations

---

## License

This codebase is intended for research and non-commercial use. Refer to each external dependency and model's license for redistribution and commercial permissions.
