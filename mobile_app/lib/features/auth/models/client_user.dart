/// نموذج بيانات المتدرب والمصادقة
class ClientUser {
  final int id;
  final String clientCode;
  final String? fullName;
  final String? phoneNumber;
  final String? email;
  final String? subscriptionTier; // ELITE, MAX, standard
  final String? coachNotes;

  ClientUser({
    required this.id,
    required this.clientCode,
    this.fullName,
    this.phoneNumber,
    this.email,
    this.subscriptionTier,
    this.coachNotes,
  });

  factory ClientUser.fromJson(Map<String, dynamic> json) {
    return ClientUser(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      clientCode: json['client_code']?.toString() ?? json['clientCode']?.toString() ?? '',
      fullName: json['full_name']?.toString() ?? json['fullName']?.toString() ?? json['name']?.toString(),
      phoneNumber: json['phone_number']?.toString() ?? json['phoneNumber']?.toString(),
      email: json['email']?.toString(),
      subscriptionTier: json['subscription_tier']?.toString() ?? json['tier']?.toString() ?? 'MAX',
      coachNotes: json['coach_notes']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'client_code': clientCode,
      'full_name': fullName,
      'phone_number': phoneNumber,
      'email': email,
      'subscription_tier': subscriptionTier,
      'coach_notes': coachNotes,
    };
  }
}
