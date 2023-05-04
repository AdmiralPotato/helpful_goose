const initGooseDataStructures = () => {
  const uint8Max = 255
  const uint16Max = 65535
  const pi = Math.PI
  const tau = pi * 2

  const concatUint8ArrayBuffers = function () {
    const argsButItsAnArray = Object.values(arguments)
    let result = new Uint8Array(0)
    argsButItsAnArray.forEach(function (uint8Array) {
      const compound = new Uint8Array(
        result.byteLength +
        uint8Array.byteLength
      )
      compound.set(result, 0)
      compound.set(uint8Array, result.byteLength)
      result = compound
    })
    return result
  }
  const textEncoder = new TextEncoder('utf-8')
  const textDecoder = new TextDecoder('utf-8')
  const encodeAxis = (axis) => Math.round((axis / 2) * uint16Max)
  const decodeAxis = (value) => (value * 2) / uint16Max
  const encodeNormalized16 = (axis) => Math.round(axis * uint16Max)
  const decodeNormalized16 = (value) => value / uint16Max
  const encodeAngle = (angle) => Math.round(((angle + pi) / tau) * uint16Max)
  const decodeAngle = (value) => ((value / uint16Max) * tau) - pi
  const encodeAction = (action) => Math.round(Math.min(1, action) * uint8Max)
  const decodeAction = (value) => value / uint8Max
  const sanitizeUint = (value) => parseInt(Math.abs(value)) || 0
  const structures = {
    UserAction: {
      // typedef struct {
      //   char id[4],
      //   uint8_t action
      // } UserAction = 5
      eventKey: 'a', // for action
      encode (userAction) {
        const arrayBuffer = new ArrayBuffer(5)
        const dataView = new DataView(arrayBuffer, arrayBuffer.byteOffset, arrayBuffer.byteLength)
        const id = textEncoder.encode(userAction.id)
        const action = encodeAction(userAction.action)

        let offset = 0
        dataView.setUint8(offset, id[0])
        offset += 1
        dataView.setUint8(offset, id[1])
        offset += 1
        dataView.setUint8(offset, id[2])
        offset += 1
        dataView.setUint8(offset, id[3])
        offset += 1
        dataView.setUint8(offset, action)
        offset += 1
        return arrayBuffer
      },
      decode (arrayBuffer) {
        const dataView = new DataView(arrayBuffer, arrayBuffer.byteOffset, arrayBuffer.byteLength)
        let offset = 0
        const id = textDecoder.decode(arrayBuffer.slice(offset, offset + 4))
        offset += 4
        const action = decodeAction(dataView.getUint8(offset))
        offset += 1

        return {
          id,
          action,
          byteLength: offset
        }
      }
    },
    UserMove: {
      // typedef struct {
      //   uint16_t moveAngle,
      //   char id[4],
      //   uint8_t moveForce,
      //   optional<uint16_t> aimAngle,
      //   optional<uint8_t> aimForce
      // } UserMove = 7 or 10
      eventKey: 'm', // for move
      encode (userMove) {
        if ((userMove.aimAngle === null) !== (userMove.aimForce === null)) {
          throw new Error('aimAngle and aimForce must both be null if either is null')
        }
        const bufferLength = userMove.aimAngle === null ? 7 : 10
        const arrayBuffer = new ArrayBuffer(bufferLength)
        const dataView = new DataView(arrayBuffer, arrayBuffer.byteOffset, arrayBuffer.byteLength)
        const id = textEncoder.encode(userMove.id)
        const moveAngle = encodeAngle(userMove.moveAngle)
        const moveForce = encodeAction(userMove.moveForce)

        let offset = 0
        dataView.setUint16(offset, moveAngle)
        offset += 2
        dataView.setUint8(offset, id[0])
        offset += 1
        dataView.setUint8(offset, id[1])
        offset += 1
        dataView.setUint8(offset, id[2])
        offset += 1
        dataView.setUint8(offset, id[3])
        offset += 1

        dataView.setUint8(offset, moveForce)
        offset += 1

        if (userMove.aimAngle !== null) {
          const aimAngle = encodeAngle(userMove.aimAngle)
          const aimForce = encodeAction(userMove.aimForce)
          dataView.setUint16(offset, aimAngle)
          offset += 2
          dataView.setUint8(offset, aimForce)
          offset += 1
        }

        return arrayBuffer
      },
      decode (arrayBuffer) {
        const dataView = new DataView(arrayBuffer, arrayBuffer.byteOffset, arrayBuffer.byteLength)
        let offset = 0
        const moveAngle = decodeAngle(dataView.getUint16(offset))
        offset += 2
        const id = textDecoder.decode(arrayBuffer.slice(offset, offset + 4))
        offset += 4
        const moveForce = decodeAction(dataView.getUint8(offset))
        offset += 1

        let aimAngle = null
        let aimForce = null
        if (arrayBuffer.byteLength >= 10) {
          aimAngle = decodeAngle(dataView.getUint16(offset))
          offset += 2
          aimForce = decodeAction(dataView.getUint8(offset))
          offset += 1
        }

        return {
          id,
          moveAngle,
          moveForce,
          byteLength: offset,
          aimAngle,
          aimForce
        }
      }
    },
    UserRelease: {
      // typedef struct {
      //   char id[4],
      // } UserRelease = 4
      eventKey: 'r', // for release
      encode (userMove) {
        return textEncoder.encode(userMove.id).buffer
      },
      decode (arrayBuffer) {
        return {
          id: textDecoder.decode(arrayBuffer)
        }
      }
    },
    Bounds: {
      // typedef struct {
      //   uint16_t width,
      //   uint16_t height,
      // } Bounds = 4 bytes
      encode (bounds) {
        const arrayBuffer = new ArrayBuffer(4)
        const dataView = new DataView(arrayBuffer, arrayBuffer.byteOffset, arrayBuffer.byteLength)
        const width = sanitizeUint(bounds.width)
        const height = sanitizeUint(bounds.height)

        let offset = 0
        dataView.setUint16(offset, width)
        offset += 2
        dataView.setUint16(offset, height)
        offset += 2
        return arrayBuffer
      },
      decode (arrayBuffer) {
        const dataView = new DataView(arrayBuffer, arrayBuffer.byteOffset, arrayBuffer.byteLength)
        let offset = 0
        const width = dataView.getUint16(offset)
        offset += 2
        const height = dataView.getUint16(offset)
        offset += 2

        return {
          x: 0,
          y: 0,
          width,
          height,
          byteLength: offset
        }
      }
    },
    UserState: {
      // typedef struct {
      //  uint16_t x,
      //  uint16_t y,
      //  uint16_t bodyAngle, -pi to +pi
      //  uint16_t headAngle,
      //  uint16_t eyeAngle,
      //  uint8_t action,
      //  uint8_t id
      // } UserState = 12 bytes
      encode (userState, index) {
        const arrayBuffer = new ArrayBuffer(12)
        const dataView = new DataView(arrayBuffer, arrayBuffer.byteOffset, arrayBuffer.byteLength)
        const x = encodeAxis(userState.x)
        const y = encodeAxis(userState.y)
        const bodyAngle = encodeAngle(userState.bodyAngle)
        const headAngle = encodeAngle(userState.headAngle)
        const eyeAngle = encodeAngle(userState.eyeAngle)
        const action = encodeAction(userState.action)

        let offset = 0
        dataView.setUint16(offset, x)
        offset += 2
        dataView.setUint16(offset, y)
        offset += 2
        dataView.setUint16(offset, bodyAngle)
        offset += 2
        dataView.setUint16(offset, headAngle)
        offset += 2
        dataView.setUint16(offset, eyeAngle)
        offset += 2
        dataView.setUint8(offset, action)
        offset += 1
        dataView.setUint8(offset, index || 0)
        offset += 1
        return arrayBuffer
      },
      decode (arrayBuffer) {
        const dataView = new DataView(arrayBuffer, arrayBuffer.byteOffset, arrayBuffer.byteLength)
        let offset = 0
        const x = decodeAxis(dataView.getUint16(offset))
        offset += 2
        const y = decodeAxis(dataView.getUint16(offset))
        offset += 2
        const bodyAngle = decodeAngle(dataView.getUint16(offset))
        offset += 2
        const headAngle = decodeAngle(dataView.getUint16(offset))
        offset += 2
        const eyeAngle = decodeAngle(dataView.getUint16(offset))
        offset += 2
        const action = decodeAction(dataView.getUint8(offset))
        offset += 1
        const id = dataView.getUint8(offset)
        offset += 1

        return {
          id,
          x,
          y,
          bodyAngle,
          headAngle,
          eyeAngle,
          action,
          byteLength: offset
        }
      }
    },
    UserDetail: {
      // typedef struct {
      //   uint16_t scale,
      //   uint8_t id,
      //   uint8_t avatar,
      //   uint8_t name_length, on average 32,
      //   char name[name_length]
      // } UserDetail = ~40 bytes
      encode (userDetails, index) {
        const scale = encodeNormalized16(userDetails.scale)
        const id = sanitizeUint(index || 0)
        const avatar = sanitizeUint(userDetails.avatar)
        const stringByteArray = textEncoder.encode(userDetails.name)
        const nameLength = stringByteArray.byteLength
        if (nameLength > 255) {
          const errorMessage = `Input string must be fewer than 255 bytes long! Input: "${userDetails.name}"`
          throw new Error(errorMessage)
        }
        const arrayBuffer = new ArrayBuffer(5)
        const dataView = new DataView(arrayBuffer, arrayBuffer.byteOffset, arrayBuffer.byteLength)
        let offset = 0
        dataView.setUint16(offset, scale)
        offset += 2
        dataView.setUint8(offset, id)
        offset += 1
        dataView.setUint8(offset, avatar)
        offset += 1
        dataView.setUint8(offset, nameLength)
        offset += 1

        return concatUint8ArrayBuffers(
          new Uint8Array(arrayBuffer),
          stringByteArray
        ).buffer
      },
      decode (arrayBuffer) {
        const dataView = new DataView(arrayBuffer, arrayBuffer.byteOffset, arrayBuffer.byteLength)
        let offset = 0
        const scale = decodeNormalized16(dataView.getUint16(offset))
        offset += 2
        const id = dataView.getUint8(offset)
        offset += 1
        const avatar = dataView.getUint8(offset)
        offset += 1
        const nameLength = dataView.getUint8(offset)
        offset += 1
        const stringBuffer = new Uint8Array(arrayBuffer)
          .slice(offset, offset + nameLength)
        const name = textDecoder.decode(stringBuffer)
        offset += nameLength

        return {
          scale,
          id,
          avatar,
          name,
          byteLength: offset
        }
      }
    },
    GameState: {
      // typedef struct {
      //   uint8_t userCount,
      //   UserState users[userCount]
      // } GameState = 1 + 5 * 10 = 51 bytes per frame
      eventKey: 's', // for state
      encode (users) {
        const userLength = new Uint8Array(1)
        userLength[0] = users.length
        const allTheBuffers = [
          userLength
        ]
        users.forEach((user, index) => {
          allTheBuffers.push(
            new Uint8Array(structures.UserState.encode(user, index))
          )
        })
        return concatUint8ArrayBuffers.apply(null, allTheBuffers).buffer
      },
      decode (arrayBuffer) {
        const userStates = []
        const dataView = new DataView(arrayBuffer, arrayBuffer.byteOffset, arrayBuffer.byteLength)
        let offset = 0
        const userLength = dataView.getUint8(offset)
        offset += 1
        for (let i = 0; i < userLength; i++) {
          const bufferForward = new Uint8Array(arrayBuffer).slice(offset).buffer
          const user = structures.UserState.decode(bufferForward, i)
          userStates.push(user)
          offset += user.byteLength
        }
        return userStates
      }
    },
    AllUserDetails: {
      // typedef struct {
      //   uint8_t userCount,
      //   UserDetails userDetails[userCount]
      // } AllUserDetails = 1 + 200 bytes per frame
      eventKey: 'd', // for details
      encode (users) {
        const userLength = new Uint8Array(1)
        userLength[0] = users.length
        const allTheBuffers = [
          userLength
        ]
        users.forEach((user, index) => {
          allTheBuffers.push(
            new Uint8Array(structures.UserDetail.encode(user, index))
          )
        })
        return concatUint8ArrayBuffers.apply(null, allTheBuffers).buffer
      },
      decode (arrayBuffer) {
        const userDetails = []
        const dataView = new DataView(arrayBuffer, arrayBuffer.byteOffset, arrayBuffer.byteLength)
        let offset = 0
        const userLength = dataView.getUint8(offset)
        offset += 1
        for (let i = 0; i < userLength; i++) {
          const bufferForward = new Uint8Array(arrayBuffer).slice(offset).buffer
          const user = structures.UserDetail.decode(bufferForward)
          userDetails.push(user)
          offset += user.byteLength
        }
        return userDetails
      }
    },
    CompleteGameState: {
      // typedef struct {
      //   Bounds bounds,
      //   uint16_t cursorRadius,
      //   uint8_t userCount,
      //   UserState users[userCount]
      //   UserDetail userDetails[userCount]
      // } CompleteGameState = 4 + 1 + 45 + 200 bytes per frame = 250 bytes
      eventKey: 'c', // for complete
      encode (complete) {
        const cursorRadius = new Uint16Array(1)
        cursorRadius[0] = encodeNormalized16(complete.cursorRadius)
        const userCount = new Uint8Array(1)
        userCount[0] = complete.users.length
        const allTheBuffers = [
          new Uint8Array(structures.Bounds.encode(complete.bounds)),
          cursorRadius,
          userCount
        ]
        complete.users.forEach((user, index) => {
          allTheBuffers.push(
            new Uint8Array(structures.UserState.encode(user, index))
          )
        })
        complete.users.forEach((user, index) => {
          allTheBuffers.push(
            new Uint8Array(structures.UserDetail.encode(user, index))
          )
        })
        return concatUint8ArrayBuffers.apply(null, allTheBuffers).buffer
      },
      decode (arrayBuffer) {
        const users = []
        const dataView = new DataView(arrayBuffer, arrayBuffer.byteOffset, arrayBuffer.byteLength)
        let offset = 0
        const bounds = structures.Bounds.decode(new Uint8Array(arrayBuffer).slice(offset).buffer)
        offset += bounds.byteLength
        const cursorRadius = decodeNormalized16(dataView.getUint16(offset))
        offset += 2
        const userCount = dataView.getUint8(offset)
        offset += 1
        for (let i = 0; i < userCount; i++) {
          const bufferForward = new Uint8Array(arrayBuffer).slice(offset).buffer
          const userState = structures.UserState.decode(bufferForward)
          users.push(userState)
          offset += userState.byteLength
        }
        for (let i = 0; i < userCount; i++) {
          const user = users[i]
          const bufferForward = new Uint8Array(arrayBuffer).slice(offset).buffer
          const userDetails = structures.UserDetail.decode(bufferForward)
          Object.assign(
            user,
            userDetails
          )
          const apectScaleRatio = Math.max(1, bounds.height / bounds.width)
          user.combinedScale = user.scale * cursorRadius * apectScaleRatio
          offset += userDetails.byteLength
        }
        return {
          bounds,
          cursorRadius,
          users
        }
      }
    },
    mergeCompleteStateWithPartialState (complete, partial) {
      complete.users.forEach((user, index) => {
        const partialUser = partial.users[index]
        if (partialUser) {
          Object.assign(
            user,
            partialUser
          )
        }
      })
      return complete
    },
    createStructureEmitter (socket, base64ArrayBuffer) {
      const eventStructureMap = {
        action: structures.UserAction,
        change: structures.UserMove,
        release: structures.UserRelease
      }
      return (eventType, data) => {
        const structure = eventStructureMap[eventType]
        if (!structure) {
          throw new Error(`Invalid eventType: ${eventType}`)
        }
        // console.log(eventType, data)
        socket.emit(
          structure.eventKey,
          base64ArrayBuffer.encode(structure.encode(data))
        )
      }
    },
    attachStructureListeners (socket, base64ArrayBuffer, handlerMap) {
      const eventStructureMap = {
        action: structures.UserAction,
        change: structures.UserMove,
        release: structures.UserRelease,
        update: structures.GameState,
        complete: structures.CompleteGameState
      }
      Object.entries(handlerMap).forEach(([eventType, handler]) => {
        const structure = eventStructureMap[eventType]
        if (!structure) {
          throw new Error(`Invalid eventType: ${eventType}`)
        }
        socket.on(structure.eventKey, (base64ByteArrayString) => {
          handler(
            socket,
            structure.decode(base64ArrayBuffer.decode(base64ByteArrayString))
          )
        })
      })
    }
  }

  if (typeof window !== 'undefined') {
    window.gooseBinaryStructures = structures
  } else if (module && module.exports) {
    module.exports = structures
  } else {
    throw new Error('Incompatible Module Bundling approach')
  }
}

initGooseDataStructures()
