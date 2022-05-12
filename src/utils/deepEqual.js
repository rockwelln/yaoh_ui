export default function equal (o, p) {
    var i,
        keysO = Object.keys(o).sort(),
        keysP = Object.keys(p).sort();
    if (keysO.length !== keysP.length)
        return false;//not the same nr of keys
    if (keysO.join('') !== keysP.join(''))
        return false;//different keys
    for (i=0;i<keysO.length;++i)
    {
        if (o[keysO[i]] instanceof Array)
        {
            if (!(p[keysO[i]] instanceof Array)) {
              console.log("look here 1", p[keysO[i]], keysO[i])
              return false;
            }
            if (o[keysO[i]].length !== p[keysO[i]].length) {
              console.log("look here 2", o[keysO[i]], p[keysO[i]])
              return false;
            }

            if (!equal(o[keysO[i]], p[keysO[i]])) {
                console.log("look here 3", o[keysO[i]], p[keysO[i]])
                return false;
            }
        }
        else if (o[keysO[i]] instanceof Date)
        {
            if (!(p[keysO[i]] instanceof Date)) {
              console.log("look here 4", keysO[i], p[keysO[i]])
              return false;
            }
            if ((''+o[keysO[i]]) !== (''+p[keysO[i]])){
              console.log("look here 5", keysO[i], p[keysO[i]])
              return false;
            }

        }
        else if (o[keysO[i]] instanceof Function)
        {
            //ignore functions, or check them regardless?
        }
        else if (o[keysO[i]] instanceof Object)
        {
            if (!(p[keysO[i]] instanceof Object))
                return false;
            if (o[keysO[i]] === o)
            {//self reference?
                if (p[keysO[i]] !== p)
                    return false;
            }
            else if (equal(o[keysO[i]], p[keysO[i]]) === false)
                return false;//WARNING: does not deal with circular refs other than ^^

        } else if (o[keysO[i]] !== p[keysO[i]] && o[keysO[i]] && p[keysO[i]]) {//change !== to != for loose comparison
          console.log("look here 8", o[keysO[i]], p[keysO[i]])
          return false;//not the same value
        }
    }
    return true;
}