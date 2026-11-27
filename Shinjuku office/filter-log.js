#!/usr/bin/env node

'use strict';

const fs = require('fs');
const readline = require('readline');

const filename = process.argv[2];
const filterArgument = process.argv[3];

if (!filename || !filterArgument) {
    console.error(
        'Usage: node filter-log.js <filename> "INT:|CLOCK|Beep|KEYBOARD|LED"'
    );
    process.exit(1);
}

const sevenSegmentMap = {C0: '0',E0: '',F9: '1',A4: '2',B0: '3',99: '4',92: '5',82: '6',F8: '7',80: '8',90: '9',FF: ''};

function decodeElectronicDisplay(hexString, width = 4) {
    if (typeof hexString !== 'string' || hexString.trim() === '') {
        return '';
    }

    const digits = hexString
        .trim()
        .split(/\s+/)
        .map(byte => sevenSegmentMap[byte.toUpperCase()] ?? '?')
        .filter(digit => digit !== '')
        .reverse()
        .join('');

    return digits.padStart(width, '0');
}

const dict = [
    { key: '0E  02   38 00', tag: 'DISARM' },
    { key: '0E  02   38 01', tag: 'ARMING - Electronic Purchase' },
    { key: '0E  02   38 02', tag: 'ARMING - COLD DRINKS' },
    { key: '0E  02   38 03', tag: 'UNKNOWN' },
    { key: '0E  02   38 04', tag: 'CANCEL SALE' },
    { key: '0E  02   38 05', tag: 'UNKNOWN' },
    { key: '0E  02   38 06', tag: 'REJECT Coins' },
    { key: '0E  02   38 10', tag: 'DISARM - HOT DRINKS' },
    { key: '0E  02   38 12', tag: 'ARMING - HOT DRINKS' },
    { key: '0E  07   35 01', tag: 'DRINK SELECT - 35!' },
    { key: '0E  07   35 00', tag: 'DRINK SELECT - 35!' },
    { key: '0E  02   39 01', tag: 'END TRANSACTION - 39 01' },
    { key: '0E  02   39 02', tag: 'END TRANSACTION - 39 02' },
    { key: '0E  02   39 03', tag: 'END TRANSACTION - 39 03' },
    { key: '0E  02   39 10', tag: 'END TRANSACTION - 39 10' },
    { key: 'KEYBOARD : Row', tag: 'DISP:' },
    { key: 'VEND NEW : 33 Recrd',     tag: '33REC'    },
    { key: '   0E  19   33',  tag: '33REC'},
    { key: 'VM ROOT  - HEAD     : $:',     tag: 'HEAD'   },
    { key: '   0E  08   E0', tag: 'HEAD'},
];


const kanaMap = new Map([
    [0xB0, 'ｰ'],

    [0xB1, 'ｱ'], [0xB2, 'ｲ'], [0xB3, 'ｳ'], [0xB4, 'ｴ'], [0xB5, 'ｵ'],
    [0xB6, 'ｶ'], [0xB7, 'ｷ'], [0xB8, 'ｸ'], [0xB9, 'ｹ'], [0xBA, 'ｺ'],
    [0xBB, 'ｻ'], [0xBC, 'ｼ'], [0xBD, 'ｽ'], [0xBE, 'ｾ'], [0xBF, 'ｿ'],

    [0xC0, 'ﾀ'], [0xC1, 'ﾁ'], [0xC2, 'ﾂ'], [0xC3, 'ﾃ'], [0xC4, 'ﾄ'],
    [0xC5, 'ﾅ'], [0xC6, 'ﾆ'], [0xC7, 'ﾇ'], [0xC8, 'ﾈ'], [0xC9, 'ﾉ'],
    [0xCA, 'ﾊ'], [0xCB, 'ﾋ'], [0xCC, 'ﾌ'], [0xCD, 'ﾍ'], [0xCE, 'ﾎ'],
    [0xCF, 'ﾏ'],

    [0xD0, 'ﾐ'], [0xD1, 'ﾑ'], [0xD2, 'ﾒ'], [0xD3, 'ﾓ'],
    [0xD4, 'ﾔ'], [0xD5, 'ﾕ'], [0xD6, 'ﾖ'],
    [0xD7, 'ﾗ'], [0xD8, 'ﾘ'], [0xD9, 'ﾙ'], [0xDA, 'ﾚ'], [0xDB, 'ﾛ'],
    [0xDC, 'ﾜ'], [0xDD, 'ﾝ'],

    [0xDE, 'ﾞ'],
    [0xDF, 'ﾟ']
]);


const statusMap = {
    '20': { stock: 'IN',  type: 'HOT' },
    '21': { stock: 'OOS', type: 'HOT' },
    '10': { stock: 'IN',  type: 'COLD' },
    '11': { stock: 'OOS', type: 'COLD' }
};

function decodePackedDecimal(lowByte, highByte) {
    // Values are stored least-significant byte first:
    // 40 01 -> 01 40 -> 0140 -> 140
    const packed = `${highByte}${lowByte}`;

    if (!/^\d+$/.test(packed)) {
        throw new Error(`Invalid packed-decimal value: ${lowByte} ${highByte}`);
    }

    return Number.parseInt(packed, 10);
}

function format33Record(record) {
    if (typeof record !== 'string' || record.trim() === '') {
        return '';
    }

    const bytes = record
        .trim()
        .split(/\s+/)
        .map(byte => byte.toUpperCase());

    if (bytes.length < 11) {
        throw new Error(
            `Invalid 33 record: expected at least 11 bytes, received ${bytes.length}`
        );
    }

    if (bytes[0] !== '33') {
        throw new Error(`Not a 33 record: ${bytes[0]}`);
    }

    const recordIndex = Number.parseInt(bytes[1], 10);

    // Positions 6, 5, 4:
    // 10 27 05 -> 05 27 10 -> 052710
    const productCode = [
        bytes[5],
        bytes[4],
        bytes[3]
    ].join('');

    const status = statusMap[bytes[6]];

    if (!status) {
        throw new Error(`Unknown stock/type status: ${bytes[6]}`);
    }

    const price = decodePackedDecimal(bytes[7], bytes[8]);
    const electronicPrice = decodePackedDecimal(bytes[9], bytes[10]);

    return [
        '33',
        String(recordIndex).padStart(2, '0'),
        productCode,
        status.stock.padEnd(3, ' '),
        status.type.padEnd(4, ' '),
        `¥${price}`,
        `¥${electronicPrice}`
    ].join(' ');
}

function getDataAfterKey(value, key) {
    const position = value.indexOf(key);

    if (position === -1) {
        return '';
    }

    return value
        .slice(position + key.length)
        .trim();
}


function decodeKanaHex(hexString) {
    if (typeof hexString !== 'string' || hexString.trim() === '') {
        return '';
    }

    return hexString
        .trim()
        .split(/\s+/)
        .map(hexByte => {
            const code = Number.parseInt(hexByte, 16);

            if (Number.isNaN(code)) {
                return '?';
            }

            if (code === 0x20) {
                return ' ';
            }

            if (code >= 0x21 && code <= 0x7E) {
                return String.fromCharCode(code);
            }

            return kanaMap.get(code) ?? '?';
        })
        .join('');
}

function getAsciiBytes(value) {
    const match = value.match(/0E\s+13\s+((?:[0-9A-Fa-f]{2}\s*)+)/);

    if (!match) {
        return null;
    }

    const bytes = match[1].trim().split(/\s+/);

    return bytes.slice(3).join(' ');
}

function get33MessageData(line) {
    if (typeof line !== 'string' || line.trim() === '') {
        return '';
    }

    const parts = line.trim().split(/\s+/);

    const headerIndex = parts.findIndex((part, index) =>
        part.toUpperCase() === '0E' &&
        parts[index + 1]?.toUpperCase() === '19' &&
        parts[index + 2]?.toUpperCase() === '33'
    );

    if (headerIndex === -1) {
        return '';
    }

    // Skip the 0E 19 header and return from 33 onward.
    return parts.slice(headerIndex + 2).join(' ');
}

function appendMessageTag(value) {

    const match = dict.find(item => value.includes(item.key));

    if (!match) {
        return value;
    }

    const fixedWidth = value
        .slice(0, 155)
        .padEnd(155, ' ');

	if(match.tag == "DISP:") {
		let display = getAsciiBytes(value);
		display = decodeKanaHex(display);
		return `${fixedWidth}${match.tag} : ${display}`; 
	} else {
	
		if(match.tag == '33REC') { 
			let inv = format33Record(get33MessageData(value));
			return `${fixedWidth}${inv}`;
		}else {
			
			if(match.tag == 'HEAD') {
				const dispHex = getDataAfterKey(value, '   0E  08');
				//console.log(dispHex);
				return `${fixedWidth}HEAD $${decodeElectronicDisplay(dispHex)}`
			}else
		
			return `${fixedWidth}${match.tag}`;
		}
	}
}


const filters = filterArgument
    .split('|');

const input = fs.createReadStream(filename, {
    encoding: 'utf8'
});

input.on('error', error => {
    console.error(`Unable to read "${filename}": ${error.message}`);
    process.exit(1);
});

const reader = readline.createInterface({
    input,
    crlfDelay: Infinity
});

reader.on('line', line => {
    const shouldFilterOut = filters.some(filter => line.includes(filter));

    if (!shouldFilterOut) {
       console.log(appendMessageTag(line));
    }
});

