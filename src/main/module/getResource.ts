export const getJsonVersion = (file: NonSharedBuffer) => {
    try {
        // 将 buffer 转换为字符串
        const jsonString = file.toString('utf8');
        // 解析 JSON
        const jsonData = JSON.parse(jsonString);
        
        // 检查是否有 skeleton 对象和 spine 字段
        if (jsonData.skeleton && jsonData.skeleton.spine) {
            return jsonData.skeleton.spine;
        }
        
        return null;
    } catch (error) {
        console.error('Error parsing JSON file:', error);
        return null;
    }
}

export const getSkelVersion = (file: NonSharedBuffer) => {
    try {
        // 创建 BinaryInput 实例
        const input = new BinaryInput(file);
        
        // 读取版本字符串
        const versionString = input.readString();
        
        if (!versionString) {
            return null;
        }
        
        // 使用正则表达式匹配版本号 (x.y.z 格式)
        const versionMatch = versionString.match(/(\d+\.\d+\.\d+)/);
        if (versionMatch) {
            return versionMatch[1]; // 返回匹配到的版本号
        }
        
        return null;
    } catch (error) {
        console.error('Error parsing skel file:', error);
        return null;
    }
}

// BinaryInput 类实现
class BinaryInput {
    private index: number;
    private buffer: DataView;

    constructor(data: Buffer) {
        this.index = 8;
        this.buffer = new DataView(data.buffer, data.byteOffset, data.byteLength);
    }

    readByte(): number {
        return this.buffer.getInt8(this.index++);
    }

    readUnsignedByte(): number {
        return this.buffer.getUint8(this.index++);
    }

    readInt(optimizePositive?: boolean): number {
        let b = this.readByte();
        let result = b & 0x7F;
        if ((b & 0x80) != 0) {
            b = this.readByte();
            result |= (b & 0x7F) << 7;
            if ((b & 0x80) != 0) {
                b = this.readByte();
                result |= (b & 0x7F) << 14;
                if ((b & 0x80) != 0) {
                    b = this.readByte();
                    result |= (b & 0x7F) << 21;
                    if ((b & 0x80) != 0) {
                        b = this.readByte();
                        result |= (b & 0x7F) << 28;
                    }
                }
            }
        }
        return optimizePositive ? result : ((result >>> 1) ^ -(result & 1));
    }

    readString(): string | null {
        const byteCount = this.readInt(true);
        switch (byteCount) {
            case 0:
                return null;
            case 1:
                return "";
        }
        const actualByteCount = byteCount - 1;
        let chars = "";
        for (let i = 0; i < actualByteCount;) {
            const b = this.readUnsignedByte();
            switch (b >> 4) {
                case 12:
                case 13:
                    chars += String.fromCharCode(((b & 0x1F) << 6 | this.readByte() & 0x3F));
                    i += 2;
                    break;
                case 14:
                    chars += String.fromCharCode(((b & 0x0F) << 12 | (this.readByte() & 0x3F) << 6 | this.readByte() & 0x3F));
                    i += 3;
                    break;
                default:
                    chars += String.fromCharCode(b);
                    i++;
            }
        }
        return chars;
    }
}
