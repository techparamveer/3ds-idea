"""Side-angle evidence; run from the preserved silver-corners Blender checkpoint."""
import render_sourced_dimensions as renderer


def main():
    views = renderer.VIEWS
    try:
        renderer.VIEWS = [('right-oblique', 0, (300, -40, 130), (0, 0, 11), 155, 0)]
        renderer.main('side-audit', resolution=(840, 474))
        renderer.VIEWS = [('right-photo-angle', 0, (380, 0, 100), (0, 0, 11), 155, 0)]
        renderer.main('side-audit', resolution=(840, 474), perspective_lens=75)
    finally:
        renderer.VIEWS = views


if __name__ == '__main__':
    main()
