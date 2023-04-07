import fs from 'fs';
import vault from 'ansible-vault'
import path from 'path'
import yaml from 'yaml'

function extract(path: Array<string>, obj: any): unknown {
    if (path.length === 0) {
        return obj;
    }
    if (Array.isArray(obj)) {
        let needle = parseInt(path.shift()!)
        return extract(path, obj[needle])
    }
    if (obj instanceof Object) {
        let needle = path.shift()!
        return extract(path, obj[needle])
    }
    throw "Illegal obj type."
}

module.exports.templateTags = [{
    name: 'vault',
    displayName: 'vault',
    description: 'read value from vault',
    args: [
        {
            displayName: 'password file',
            description: 'value password file path',
            type: 'file'
        },
        {
            displayName: 'encrypted file',
            description: 'value encrypted file path',
            type: 'file'
        },
        {
            displayName: 'property path',
            description: 'the property to be extracted from vault',
            type: 'string',
            defaultValue: '',
            placeholder: 'value.path'
        }
    ],
    async run(_context: any, pwdPath: string, filePath: string, property: string) {
        let pwd = fs.readFileSync(pwdPath, 'utf-8').trim();
        let vaultcontent = fs.readFileSync(filePath, 'utf-8').trim();
        let v = new vault.Vault({ password: pwd })
        let decrypted = v.decryptSync(vaultcontent, undefined)!;
        let obj = null;
        switch (path.extname(filePath)) {
            case '.yml':
            case '.yaml':
                obj = yaml.parse(decrypted)
                break
            case '.json':
                obj = JSON.parse(decrypted)
                break
            default:
                throw 'Unsupported file format'
        }
        return extract(property.split('.'), obj)
    }
}];
