# Camera stereo badge probe — 28 September 2026

The published EUR `P_FinderVS_U` binds the same `P_IconOth_3D.bclim` texture to `3DView` and `2DView`. Material 18 (`3DView`) has white constant 0, while material 19 (`2DView`) has `[100,100,100,255]`. The preserved native HNI stereo browse shows a dark cube. Its stereo image path and badge selection are therefore separate concerns; the capture supports the source grey `2DView` artwork while keeping the stereo image fit and hidden finder edges.

The pre-change raw 400×240 browser upper compared with the preserved native upper has **33,997/96,000 pixels over 2/255 and RGB MAE 2.6967**. In the `[360,0,40,40]` badge ROI, **612/1,600 pixels exceed 2/255 and RGB MAE is 35.259**. These are *pre-change* measures. A fresh browser capture is required to measure this candidate. The existing raw comparison remains a failed whole-screen result.
