import cv2
import numpy as np
import torch
import open3d as o3d
import pyvista as pv
from exif_extractor import extract_camera_intrinsics
from pre_processing import refine_point_cloud
import mesh_generatation
from depthmap import depth_genrate


def generate_model(url):
    """
    Generate a 3D mesh and point cloud from an input image using depth estimation.

    Parameters:
    -----------
    url : numpy.ndarray
        Input RGB image as a NumPy array in BGR format (OpenCV standard).

    Returns:
    --------
    mesh : open3D.geometry.TriangleMesh
        Reconstructed 3D mesh after surface reconstruction.
    point_cloud : pyvista.PolyData
        Colored point cloud in PyVista format.
    depth_map : numpy.ndarray (float32)
        Estimated depth map corresponding to input image.

    Process:
    --------
    1. Compute depth map from input image using depth_genrate().
    2. Convert BGR image to normalized RGB float32.
    3. Extract camera intrinsics (fx, fy, cx, cy) from the image.
    4. Construct pixel coordinate grid (u,v).
    5. Compute 3D coordinates (X, Y, Z) by backprojecting pixels using depth and intrinsics.
    6. Filter valid 3D points with positive depth.
    7. Create and refine an Open3D point cloud with points and colors.
    8. Convert Open3D point cloud to PyVista PolyData with color attribute.
    9. Generate mesh via surface reconstruction from point cloud.
    """

    # Step 1: Generate depth map (grayscale float32)
    depth_map = depth_genrate(url)

    # Step 2: Convert BGR to RGB and normalize to [0,1]
    rgb_image = cv2.cvtColor(url, cv2.COLOR_BGR2RGB)
    rgb_image = rgb_image.astype(np.float32) / 255.0

    height, width = depth_map.shape

    # Step 3: Convert image and depth to PyTorch tensors on GPU if available
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    depth_torch = torch.from_numpy(depth_map).to(device)
    rgb_torch = torch.from_numpy(rgb_image).to(device)

    # Step 4: Extract camera intrinsic parameters (focal lengths and principal points)
    intrinsics = extract_camera_intrinsics(rgb_image)
    fx, fy = intrinsics['fx'], intrinsics['fy']
    cx, cy = intrinsics['cx'], intrinsics['cy']

    # Step 5: Create pixel coordinate grid (u,v)
    u = torch.arange(0, width, device=device).float()
    v = torch.arange(0, height, device=device).float()
    grid_u, grid_v = torch.meshgrid(u, v, indexing='xy')

    # Step 6: Compute 3D coordinates from depth and intrinsics
    z = depth_torch
    x = (grid_u - cx) * z / fx
    y = (grid_v - cy) * z / fy

    # Step 7: Flatten arrays for processing
    x_flat = x.flatten()
    y_flat = y.flatten()
    z_flat = z.flatten()
    color_flat = rgb_torch.view(-1, 3)

    # Step 8: Filter out invalid depth points (non-positive or NaN)
    valid = (z_flat > 0) & (~torch.isnan(z_flat))

    # Stack valid 3D points and corresponding colors, flip Y axis sign
    points = torch.stack((x_flat[valid], -y_flat[valid], z_flat[valid]), dim=1).cpu().numpy()
    colors = color_flat[valid].cpu().numpy()

    # Step 9: Create Open3D point cloud and refine it
    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(points)
    pcd.colors = o3d.utility.Vector3dVector(colors)
    pcd = refine_point_cloud(pcd, nb_neighbors=20, std_ratio=2.0, voxel_size=0.01, estimate_normals=True)

    # Step 10: Convert Open3D point cloud to PyVista PolyData with RGB colors
    points_np = np.asarray(pcd.points)
    colors_np = (np.asarray(pcd.colors) * 255).astype(np.uint8)
    point_cloud = pv.PolyData(points_np)
    point_cloud["RGB"] = colors_np

    # Step 11: Apply surface reconstruction to obtain mesh from point cloud
    mesh = mesh_generatation.apply_surface_reconstruction(pcd)

    return mesh, point_cloud, depth_map
