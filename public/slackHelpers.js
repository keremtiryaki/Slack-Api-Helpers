var optionTempl = "<option value='{{val}}'>{{text}}</option>";
var messageTempl = "<p><b>{{usr}}:</b> {{msg}}</p>";
var dataR;
var users = {};

function getList() {
	var token = $("#token").val();
	if (token.trim() == "") {
		alert("token can not be empty");
		return;
	}

	waitingDialog.show();
	$("#groups-div").hide();
	$.ajax({
		"url" : "https://slack.com/api/groups.list",
		"method" : "POST",
		"data" : {
			"token" : $("#token").val(),
			"exclude_archived" : "1"
		},
		success : function(data) {
			if (data["ok"]) {
				dataR = data;
				$("#groups-select").html("");
				for (var i = 0; i < dataR.groups.length; i++) {
					var group = dataR.groups[i];
					var html = optionTempl.replace("{{val}}", group.id).replace("{{text}}", group.name);
					$("#groups-select").append(html);
				}
				$("#groups-div").show();
			} else {
				alert("error please look at the console");
				console.log(JSON.stringify(data));
			}
			waitingDialog.hide();
		}
	});
}

function getHistory() {
	waitingDialog.show();
	getUsers(function() {
		var token = $("#token").val();
		if (token.trim() == "") {
			alert("token can not be empty");
			return;
		}

		var channel = $('#groups-select').find(":selected").val();
		if (channel.trim() == "") {
			alert("channel could not found");
			return;
		}
		getAllHistory(token, channel, function(messages) {
			messages.reverse();
			$("#text-result").html("");
			for (var i = 0; i < messages.length; i++) {
				var message = messages[i];
				var html = messageTempl.replace("{{usr}}", users[message.user]).replace("{{msg}}", message.text);
				html = html.replace(/<@.*?>/ig, function(user) {
					var id = user.replace("<@", "");
					id = id.replace(">", "");
					console.log("id" + id);
					return (users[id] ? "@" + users[id] : user);
				});
				html = html.replace(/<http.*?>/ig, function(link) {
					var link = link.replace("<", "");
					link = link.replace(">", "");
					return "<a href='" + link + "' target='_blank'>" + link + "</a>";
				});

				$("#text-result").append(html);
			}
			waitingDialog.hide();
		});
	});
}

var messages = [];
function getAllHistory(token, channel, callback) {
	messages = [];
	var date = null;
	(function stepByStep() {
		var postData = {
			"token" : token,
			"channel" : channel,
			"count" : 1000,
			"inclusive" : 1
		};
		if(date != null){
			postData["latest"] = date;
		}
		$.ajax({
			"url" : "https://slack.com/api/groups.history",
			"method" : "POST",
			"data" : postData,
			success : function(data) {
				if (data.messages.length <= 1) {
					callback(messages);
				} else {
					messages = messages.concat(data.messages);
					date = messages[messages.length - 1].ts - 0.000001;
					stepByStep();
				}
			}
		});
	})();
};

function getUsers(callback) {
	var token = $("#token").val();
	if (token.trim() == "") {
		alert("token can not be empty");
		return;
	}
	$.ajax({
		"url" : "https://slack.com/api/users.list",
		"method" : "POST",
		"data" : {
			"token" : token
		},
		success : function(data) {
			if (data["ok"]) {
				var members = data["members"];
				for (var i = 0; i < members.length; i++) {
					var member = members[i];
					users[member.id] = member.name;
				}
				callback();
			} else {
				alert("error please look at the console");
				console.log(JSON.stringify(data));
			}
		}
	});
}
