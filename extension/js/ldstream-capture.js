// Runs at document_start — captures roomID before YouTube/SPAs can strip URL params
const _roomID = new URLSearchParams(location.search).get("roomID");
if (_roomID) {
    sessionStorage.setItem("lds_room_id", _roomID);
}
