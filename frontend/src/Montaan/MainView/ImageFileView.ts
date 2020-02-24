import * as THREE from 'three';
import { FSEntry } from '../lib/filesystem';
import QFrameAPI from '../../lib/api';
import { BufferGeometry } from 'three';

type GoToLine = (fsEntry: FSEntry, line: number) => void;
type GoToSearch = (fsEntry: FSEntry, search: string) => void;

const emptyMaterial = new THREE.MeshBasicMaterial();

export default class ImageFileView extends THREE.Mesh {
    fsEntry: FSEntry;
    api: QFrameAPI;
    yield: any;
    path: string;
    fontTexture: THREE.Texture;
    geometry: BufferGeometry;
    material: THREE.MeshBasicMaterial;
    requestFrame: any;
    fullyVisible: boolean = false;

    constructor(
        fsEntry: FSEntry,
        fullPath: string,
        api: QFrameAPI,
        yieldFn: any,
        requestFrame: any,
        goToLine: GoToLine,
        goToSearch: GoToSearch,
        fontTexture: THREE.Texture,
    ) {
        super();
        this.visible = false;
        this.fsEntry = fsEntry;
        this.api = api;
        this.yield = yieldFn;
        this.path = fullPath;
        this.fontTexture = fontTexture;
        this.requestFrame = requestFrame;

        this.geometry = new THREE.PlaneBufferGeometry(1, 1);
        this.material = emptyMaterial;
        this.scale.multiplyScalar(fsEntry.scale * 0.5);
        this.position.set(fsEntry.x + fsEntry.scale * 0.25, fsEntry.y + fsEntry.scale * 0.5, fsEntry.z);

        this.goToFSEntryTextAtLine = goToLine;
        this.goToFSEntryTextAtSearch = goToSearch;

        this.load(this.api.server + '/repo/file' + fullPath)
    }

    goToFSEntryTextAtLine(fsEntry: FSEntry, line: any) {
        throw new Error('Method not implemented.');
    }
    goToFSEntryTextAtSearch(fsEntry: FSEntry, search: any) {
        throw new Error('Method not implemented.');
    }

    load(src: string) {
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = src;
        const obj = this;
        img.onload = function () {
            if (obj.parent) {
                var maxD = Math.max(img.width, img.height);
                obj.scale.x *= img.width / maxD;
                obj.scale.y *= img.height / maxD;
                obj.material = new THREE.MeshBasicMaterial({
                    map: new THREE.Texture(img),
                    transparent: true,
                    depthTest: false,
                    depthWrite: false,
                });
                if (obj.material.map) obj.material.map.needsUpdate = true;
                obj.visible = true;
                obj.requestFrame();
            }
        };
    }

}