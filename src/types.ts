export interface TileData {
  px: [number, number]; // Pixel position [x, y]
  src: [number, number]; // Source tile position in tileset [x, y]
  f: number; // Flip flags (0=none, 1=flipX, 2=flipY, 3=both)
  t: number; // Tile ID
  d: [number]; // Grid position as single index
  a: number; // Alpha/opacity
}

export interface LayerInstance {
  __identifier: string;
  __type: string;
  __cWid: number; // Grid width in cells
  __cHei: number; // Grid height in cells
  __gridSize: number; // Grid cell size in pixels
  __tilesetDefUid: number | null;
  __tilesetRelPath: string | null;
  iid: string;
  levelId: number;
  layerDefUid: number;
  pxOffsetX: number;
  pxOffsetY: number;
  visible: boolean;
  gridTiles: TileData[];
  entityInstances: any[]; // Can be expanded if entities are used
}

export interface TilesetDefinition {
  __cWid: number; // Width in tiles
  __cHei: number; // Height in tiles
  identifier: string;
  uid: number;
  relPath: string; // Relative path to tileset image
  pxWid: number; // Pixel width
  pxHei: number; // Pixel height
  tileGridSize: number; // Size of each tile
  spacing: number;
  padding: number;
}

export interface LevelData {
  identifier: string;
  iid: string;
  uid: number;
  worldX: number;
  worldY: number;
  pxWid: number; // Level width in pixels
  pxHei: number; // Level height in pixels
  __bgColor: string;
  layerInstances: LayerInstance[];
}

export interface LDtkData {
  jsonVersion: string;
  defaultGridSize: number;
  defs: {
    layers: any[];
    entities: any[];
    tilesets: TilesetDefinition[];
  };
  levels: LevelData[];
}
