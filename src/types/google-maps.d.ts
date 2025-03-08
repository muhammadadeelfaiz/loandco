
// Type definitions for Google Maps JavaScript API 3.54
declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
  
  namespace google {
    namespace maps {
      class Map {
        constructor(mapDiv: Element, opts?: MapOptions);
        setCenter(latLng: LatLng | LatLngLiteral): void;
        setZoom(zoom: number): void;
        setOptions(options: MapOptions): void;
        panTo(latLng: LatLng | LatLngLiteral): void;
        panBy(x: number, y: number): void;
        fitBounds(bounds: LatLngBounds | LatLngBoundsLiteral, padding?: number | Padding): void;
        getBounds(): LatLngBounds;
        getCenter(): LatLng;
        getZoom(): number;
        getDiv(): Element;
        getMapTypeId(): string;
      }

      interface MapOptions {
        center?: LatLng | LatLngLiteral;
        zoom?: number;
        mapTypeId?: string;
        styles?: MapTypeStyle[];
        disableDefaultUI?: boolean;
        zoomControl?: boolean;
        mapTypeControl?: boolean;
        streetViewControl?: boolean;
        fullscreenControl?: boolean;
      }

      class LatLng {
        constructor(lat: number, lng: number, noWrap?: boolean);
        lat(): number;
        lng(): number;
        toString(): string;
        toUrlValue(precision?: number): string;
        toJSON(): LatLngLiteral;
      }

      interface LatLngLiteral {
        lat: number;
        lng: number;
      }

      class LatLngBounds {
        constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
        contains(latLng: LatLng | LatLngLiteral): boolean;
        equals(other: LatLngBounds | LatLngBoundsLiteral): boolean;
        extend(point: LatLng | LatLngLiteral): LatLngBounds;
        getCenter(): LatLng;
        getNorthEast(): LatLng;
        getSouthWest(): LatLng;
        isEmpty(): boolean;
        toJSON(): LatLngBoundsLiteral;
        toString(): string;
        toUrlValue(precision?: number): string;
        union(other: LatLngBounds | LatLngBoundsLiteral): LatLngBounds;
      }

      interface LatLngBoundsLiteral {
        east: number;
        north: number;
        south: number;
        west: number;
      }

      interface Padding {
        bottom: number;
        left: number;
        right: number;
        top: number;
      }

      class Marker {
        constructor(opts?: MarkerOptions);
        setMap(map: Map | null): void;
        setPosition(latLng: LatLng | LatLngLiteral): void;
        setTitle(title: string): void;
        setLabel(label: string | MarkerLabel): void;
        setIcon(icon: string | Icon | Symbol): void;
        setDraggable(draggable: boolean): void;
        setVisible(visible: boolean): void;
        setZIndex(zIndex: number): void;
        getMap(): Map | null;
        getPosition(): LatLng | null;
        getTitle(): string;
        getLabel(): MarkerLabel;
        getIcon(): string | Icon | Symbol;
        getDraggable(): boolean;
        getVisible(): boolean;
        getZIndex(): number;
        addListener(eventName: string, handler: Function): MapsEventListener;
      }

      interface MarkerOptions {
        position: LatLng | LatLngLiteral;
        map?: Map;
        title?: string;
        label?: string | MarkerLabel;
        icon?: string | Icon | Symbol;
        draggable?: boolean;
        clickable?: boolean;
        visible?: boolean;
        zIndex?: number;
        opacity?: number;
        optimized?: boolean;
      }

      interface MarkerLabel {
        color?: string;
        fontFamily?: string;
        fontSize?: string;
        fontWeight?: string;
        text: string;
      }

      interface Icon {
        url: string;
        anchor?: Point;
        labelOrigin?: Point;
        origin?: Point;
        scaledSize?: Size;
        size?: Size;
      }

      class Symbol {
        constructor(opts: SymbolOptions);
      }

      interface SymbolOptions {
        path: SymbolPath | string;
        fillColor?: string;
        fillOpacity?: number;
        scale?: number;
        strokeColor?: string;
        strokeOpacity?: number;
        strokeWeight?: number;
        rotation?: number;
      }

      enum SymbolPath {
        BACKWARD_CLOSED_ARROW,
        BACKWARD_OPEN_ARROW,
        CIRCLE,
        FORWARD_CLOSED_ARROW,
        FORWARD_OPEN_ARROW
      }

      class Point {
        constructor(x: number, y: number);
        x: number;
        y: number;
        equals(other: Point): boolean;
        toString(): string;
      }

      class Size {
        constructor(width: number, height: number, widthUnit?: string, heightUnit?: string);
        width: number;
        height: number;
        equals(other: Size): boolean;
        toString(): string;
      }

      class InfoWindow {
        constructor(opts?: InfoWindowOptions);
        open(map?: Map, anchor?: MVCObject): void;
        close(): void;
        getContent(): string | Element;
        getPosition(): LatLng;
        setContent(content: string | Element): void;
        setPosition(position: LatLng | LatLngLiteral): void;
        setZIndex(zIndex: number): void;
      }

      interface InfoWindowOptions {
        content?: string | Element;
        position?: LatLng | LatLngLiteral;
        maxWidth?: number;
        pixelOffset?: Size;
        zIndex?: number;
      }

      interface MapTypeStyle {
        elementType?: string;
        featureType?: string;
        stylers: MapTypeStyler[];
      }

      interface MapTypeStyler {
        [key: string]: string | number | boolean;
      }

      class MVCObject {
        constructor();
        addListener(eventName: string, handler: Function): MapsEventListener;
        bindTo(key: string, target: MVCObject, targetKey?: string): void;
        get(key: string): any;
        notify(key: string): void;
        set(key: string, value: any): void;
        setValues(values: any): void;
        unbind(key: string): void;
        unbindAll(): void;
      }

      interface MapsEventListener {
        remove(): void;
      }

      const event: {
        addListener(instance: object, eventName: string, handler: Function): MapsEventListener;
        addDomListener(instance: Element, eventName: string, handler: Function, capture?: boolean): MapsEventListener;
        clearInstanceListeners(instance: object): void;
        clearListeners(instance: object, eventName: string): void;
        removeListener(listener: MapsEventListener): void;
        trigger(instance: any, eventName: string, ...args: any[]): void;
      };
    }
  }
}

export {};
